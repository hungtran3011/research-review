import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Spin,
  Switch,
  Table,
  Typography,
  Space,
  Card,
  Select,
  InputNumber,
  Alert,
} from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceService } from '../../services/conference.service';
import { adminTrackService } from '../../services/admin-track.service';
import type { ColumnsType } from 'antd/es/table';
import type {
  AdminTrackConfigDto,
  AdminTrackConfigCreateRequestDto,
  AdminTrackConfigUpdateRequestDto,
} from '../../models';
import { useBasicToast } from '../../hooks/useBasicToast';

const { Text } = Typography;

const styles = {
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr 80px 100px auto',
    gap: '12px',
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
} as const;

type TrackDraft = {
  name: string;
  description: string;
  isActive: boolean;
  reviewPolicyMinCompletedReviews: number | null;
};

const TrackManagement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();
  const [selectedConferenceId, setSelectedConferenceId] = useState<string>('');

  // Query for fetching conferences
  const conferencesQuery = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => {
      const response = await conferenceService.getAll();
      return response.data || [];
    },
  });

  const conferences = conferencesQuery.data || [];

  // Query for fetching tracks for the selected conference
  const tracksQuery = useQuery({
    queryKey: ['admin-tracks', selectedConferenceId],
    queryFn: async () => {
      if (!selectedConferenceId) return [];
      const response = await adminTrackService.getAll(selectedConferenceId);
      return response.data || [];
    },
    enabled: !!selectedConferenceId,
  });

  const tracks = useMemo(() => tracksQuery.data || [], [tracksQuery.data]);
  const isLoading = tracksQuery.isLoading;

  const [createForm, setCreateForm] = useState<TrackDraft>({
    name: '',
    description: '',
    isActive: true,
    reviewPolicyMinCompletedReviews: null,
  });

  const [draftById, setDraftById] = useState<Record<string, TrackDraft>>({});

  useEffect(() => {
    if (tracks.length === 0) return;
    setDraftById((prev) => {
      const next = { ...prev };
      for (const t of tracks) {
        if (!next[t.id]) {
          next[t.id] = {
            name: t.name ?? '',
            description: t.description ?? '',
            isActive: Boolean(t.isActive),
            reviewPolicyMinCompletedReviews: t.reviewPolicyMinCompletedReviews ?? null,
          };
        }
      }
      return next;
    });
  }, [tracks]);

  // Create mutation
  const createTrack = useMutation({
    mutationFn: async (data: AdminTrackConfigCreateRequestDto) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await adminTrackService.create(selectedConferenceId, data);
    },
    onSuccess: () => {
      success('Đã tạo track thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks', selectedConferenceId] });
      setCreateForm({
        name: '',
        description: '',
        isActive: true,
        reviewPolicyMinCompletedReviews: null,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Tạo track thất bại: ' + message);
    },
  });

  // Update mutation
  const updateTrack = useMutation({
    mutationFn: async ({
      trackId,
      data,
    }: {
      trackId: string;
      data: AdminTrackConfigUpdateRequestDto;
    }) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await adminTrackService.update(selectedConferenceId, trackId, data);
    },
    onSuccess: () => {
      success('Đã cập nhật track thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks', selectedConferenceId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Cập nhật track thất bại: ' + message);
    },
  });

  // Delete mutation
  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await adminTrackService.delete(selectedConferenceId, trackId);
    },
    onSuccess: () => {
      success('Đã xóa track thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-tracks', selectedConferenceId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Xóa track thất bại: ' + message);
    },
  });

  const isMutating = createTrack.isPending || updateTrack.isPending || deleteTrack.isPending;

  const handleCreate = () => {
    if (!selectedConferenceId) {
      error('Vui lòng chọn hội nghị trước');
      return;
    }
    if (!createForm.name.trim()) {
      error('Tên track là bắt buộc');
      return;
    }

    const payload: AdminTrackConfigCreateRequestDto = {
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
      isActive: createForm.isActive,
      reviewPolicyMinCompletedReviews: createForm.reviewPolicyMinCompletedReviews,
    };

    createTrack.mutate(payload);
  };

  const updateDraft = (id: string, patch: Partial<TrackDraft>) => {
    setDraftById((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          name: '',
          description: '',
          isActive: true,
          reviewPolicyMinCompletedReviews: null,
        }),
        ...patch,
      },
    }));
  };

  const handleSave = (track: AdminTrackConfigDto) => {
    const draft = draftById[track.id];
    if (!draft) return;

    updateTrack.mutate({
      trackId: track.id,
      data: {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
        isActive: draft.isActive ?? true,
        reviewPolicyMinCompletedReviews: draft.reviewPolicyMinCompletedReviews,
      },
    });
  };

  const handleDelete = (track: AdminTrackConfigDto) => {
    deleteTrack.mutate(track.id);
  };

  const columns: ColumnsType<AdminTrackConfigDto> = [
    {
      title: 'Tên track',
      key: 'name',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.name ?? record.name}
          onChange={(e) => updateDraft(record.id, { name: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Mô tả',
      key: 'description',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.description ?? record.description}
          onChange={(e) => updateDraft(record.id, { description: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Min Reviews',
      key: 'minReviews',
      render: (_, record) => (
        <InputNumber
          value={draftById[record.id]?.reviewPolicyMinCompletedReviews}
          onChange={(value) =>
            updateDraft(record.id, { reviewPolicyMinCompletedReviews: value })
          }
          min={1}
          placeholder="Default"
          style={{ width: '100%' }}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Hoạt động',
      key: 'isActive',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={draftById[record.id]?.isActive ?? record.isActive}
          onChange={(checked) => updateDraft(record.id, { isActive: checked })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            icon={<SaveOutlined />}
            onClick={() => handleSave(record)}
            disabled={isMutating}
            size="small"
          >
            Lưu
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={isMutating}
            danger
            size="small"
          >
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong style={{ fontSize: '24px' }}>
              Quản lý Track
            </Text>
          </div>

          <div style={styles.field}>
            <Text strong>Chọn hội nghị *</Text>
            <Select
              value={selectedConferenceId || undefined}
              onChange={setSelectedConferenceId}
              placeholder="Chọn hội nghị để quản lý tracks"
              loading={conferencesQuery.isLoading}
              options={conferences.map((conf) => ({
                value: conf.id,
                label: `${conf.name} (${conf.shortName})`,
              }))}
              style={{ width: '100%', maxWidth: '600px' }}
            />
          </div>

          {!selectedConferenceId && (
            <Alert
              message="Vui lòng chọn hội nghị để xem và quản lý các track"
              type="info"
              showIcon
            />
          )}

          {selectedConferenceId && (
            <>
              <Card title="Tạo track mới" size="small">
                <div style={styles.formRow}>
                  <Input
                    placeholder="Tên track"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    disabled={isMutating}
                  />
                  <Input
                    placeholder="Mô tả"
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    disabled={isMutating}
                  />
                  <InputNumber
                    placeholder="Min Rev"
                    value={createForm.reviewPolicyMinCompletedReviews}
                    onChange={(value) =>
                      setCreateForm({ ...createForm, reviewPolicyMinCompletedReviews: value })
                    }
                    min={1}
                    style={{ width: '100%' }}
                    disabled={isMutating}
                  />
                  <Switch
                    checked={createForm.isActive}
                    onChange={(checked) => setCreateForm({ ...createForm, isActive: checked })}
                    disabled={isMutating}
                  />
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreate}
                    disabled={isMutating}
                  >
                    Tạo
                  </Button>
                </div>
              </Card>

              {isLoading ? (
                <Spin size="large" tip="Đang tải danh sách track..." />
              ) : (
                <Table
                  columns={columns}
                  dataSource={tracks}
                  rowKey="id"
                  pagination={{ pageSize: 15 }}
                  locale={{
                    emptyText: 'Không có track nào trong hội nghị này',
                  }}
                />
              )}
            </>
          )}
        </Space>
      </Card>
    </div>
  );
};

export default TrackManagement;
