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
  Tag,
} from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceService } from '../../services/conference.service';
import { adminTrackService } from '../../services/admin-track.service';
import { editorService } from '../../services/editor.service';
import { userService } from '../../services/user.service';
import type { ColumnsType } from 'antd/es/table';
import type {
  AdminTrackConfigDto,
  AdminTrackConfigCreateRequestDto,
  AdminTrackConfigUpdateRequestDto,
  EditorDto,
  UserDto,
} from '../../models';
import { useBasicToast } from '../../hooks/useBasicToast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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

  const usersQuery = useQuery({
    queryKey: ['admin-users-for-editor-assignment'],
    queryFn: async () => {
      const response = await userService.getUsers({ page: 0, size: 100 });
      return response.data?.content || [];
    },
  });

  const editorAssignmentsQuery = useQuery({
    queryKey: ['editor-assignments', selectedConferenceId],
    queryFn: async () => {
      const response = await editorService.list(0, 500);
      return response.data?.content || [];
    },
    enabled: !!selectedConferenceId,
  });

  const [createForm, setCreateForm] = useState<TrackDraft>({
    name: '',
    description: '',
    isActive: true,
    reviewPolicyMinCompletedReviews: null,
  });

  const [draftById, setDraftById] = useState<Record<string, TrackDraft>>({});
  const [editorDraftByTrackId, setEditorDraftByTrackId] = useState<Record<string, string>>({});

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
      if (!selectedConferenceId) throw new Error(t('trackManagement.errors.selectConferenceFirst'));
      return await adminTrackService.create(selectedConferenceId, data);
    },
    onSuccess: () => {
      success(t('trackManagement.messages.createSuccess'));
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
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('trackManagement.messages.unknownError')
        : t('trackManagement.messages.unknownError');
      error(t('trackManagement.messages.createFailedPrefix') + message);
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
      if (!selectedConferenceId) throw new Error(t('trackManagement.errors.selectConferenceFirst'));
      return await adminTrackService.update(selectedConferenceId, trackId, data);
    },
    onSuccess: () => {
      success(t('trackManagement.messages.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-tracks', selectedConferenceId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('trackManagement.messages.unknownError')
        : t('trackManagement.messages.unknownError');
      error(t('trackManagement.messages.updateFailedPrefix') + message);
    },
  });

  // Delete mutation
  const deleteTrack = useMutation({
    mutationFn: async (trackId: string) => {
      if (!selectedConferenceId) throw new Error(t('trackManagement.errors.selectConferenceFirst'));
      return await adminTrackService.delete(selectedConferenceId, trackId);
    },
    onSuccess: () => {
      success(t('trackManagement.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['admin-tracks', selectedConferenceId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('trackManagement.messages.unknownError')
        : t('trackManagement.messages.unknownError');
      error(t('trackManagement.messages.deleteFailedPrefix') + message);
    },
  });

  const isMutating = createTrack.isPending || updateTrack.isPending || deleteTrack.isPending;

  const assignEditor = useMutation({
    mutationFn: async ({ trackId, userId }: { trackId: string; userId: string }) => {
      return editorService.create({ trackId, userId });
    },
    onSuccess: () => {
      success(t('trackManagement.messages.assignEditorSuccess'));
      queryClient.invalidateQueries({ queryKey: ['editor-assignments', selectedConferenceId] });
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('trackManagement.messages.unknownError')
          : t('trackManagement.messages.unknownError');
      error(t('trackManagement.messages.assignEditorFailedPrefix') + message);
    },
  });

  const removeEditorAssignment = useMutation({
    mutationFn: async (editorId: string) => editorService.delete(editorId),
    onSuccess: () => {
      success(t('trackManagement.messages.removeEditorSuccess'));
      queryClient.invalidateQueries({ queryKey: ['editor-assignments', selectedConferenceId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('trackManagement.messages.unknownError')
          : t('trackManagement.messages.unknownError');
      error(t('trackManagement.messages.removeEditorFailedPrefix') + message);
    },
  });

  const isAssigningEditor = assignEditor.isPending || removeEditorAssignment.isPending;

  const availableEditorUsers = useMemo(() => {
    const users = usersQuery.data || [];
    return users.filter((user: UserDto) => user.status === 'ACTIVE' && user.role !== 'ADMIN');
  }, [usersQuery.data]);

  const assignmentsByTrackId = useMemo(() => {
    const trackIds = new Set(tracks.map((track) => track.id));
    const assignments = (editorAssignmentsQuery.data || []).filter((assignment: EditorDto) => trackIds.has(assignment.track.id));
    return assignments.reduce<Record<string, EditorDto[]>>((acc, assignment) => {
      const key = assignment.track.id;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(assignment);
      return acc;
    }, {});
  }, [editorAssignmentsQuery.data, tracks]);

  const handleCreate = () => {
    if (!selectedConferenceId) {
      error(t('trackManagement.errors.selectConferenceFirst'));
      return;
    }
    if (!createForm.name.trim()) {
      error(t('trackManagement.errors.trackNameRequired'));
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
      title: t('trackManagement.columns.trackName'),
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
      title: t('trackManagement.columns.description'),
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
      title: t('trackManagement.columns.minReviews'),
      key: 'minReviews',
      render: (_, record) => (
        <InputNumber
          value={draftById[record.id]?.reviewPolicyMinCompletedReviews}
          onChange={(value) =>
            updateDraft(record.id, { reviewPolicyMinCompletedReviews: value })
          }
          min={1}
          placeholder={t('trackManagement.columns.minReviewsPlaceholder')}
          style={{ width: '100%' }}
          disabled={isMutating}
        />
      ),
    },
    {
      title: t('trackManagement.columns.active'),
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
      title: t('trackManagement.columns.chiefEditor'),
      key: 'chiefEditor',
      render: (_, record) => {
        const selectedUserId = editorDraftByTrackId[record.id];
        const assignedEditors = assignmentsByTrackId[record.id] || [];
        return (
          <Space orientation="vertical" size={6} style={{ width: '100%' }}>
            <Space.Compact style={{ width: '100%' }}>
              <Select
                value={selectedUserId || undefined}
                onChange={(value) =>
                  setEditorDraftByTrackId((prev) => ({
                    ...prev,
                    [record.id]: value,
                  }))
                }
                placeholder={t('trackManagement.editor.placeholder')}
                showSearch
                optionFilterProp="label"
                options={availableEditorUsers.map((user) => ({
                  value: user.id,
                  label: `${user.name} (${user.email})`,
                }))}
                disabled={isAssigningEditor || usersQuery.isLoading}
                style={{ width: '100%' }}
              />
              <Button
                onClick={() => {
                  const userId = editorDraftByTrackId[record.id];
                  if (!userId) return;
                  assignEditor.mutate({ trackId: record.id, userId });
                }}
                disabled={!editorDraftByTrackId[record.id] || isAssigningEditor}
              >
                {t('trackManagement.editor.assign')}
              </Button>
            </Space.Compact>

            <Space wrap size={[4, 4]}>
              {assignedEditors.length === 0 ? (
                <Tag>{t('trackManagement.editor.none')}</Tag>
              ) : (
                assignedEditors.map((assignment) => (
                  <Tag
                    key={assignment.id}
                    closable
                    onClose={(event) => {
                      event.preventDefault();
                      removeEditorAssignment.mutate(assignment.id);
                    }}
                  >
                    {assignment.user?.name || assignment.user?.email || assignment.id}
                  </Tag>
                ))
              )}
            </Space>
          </Space>
        );
      },
    },
    {
      title: t('trackManagement.columns.actions'),
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
            {t('trackManagement.actions.save')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={isMutating}
            danger
            size="small"
          >
            {t('trackManagement.actions.delete')}
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
              {t('trackManagement.title')}
            </Text>
          </div>

          <div style={styles.field}>
            <Text strong>{t('trackManagement.selectConferenceLabel')}</Text>
            <Select
              value={selectedConferenceId || undefined}
              onChange={setSelectedConferenceId}
              placeholder={t('trackManagement.selectConferencePlaceholder')}
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
              message={t('trackManagement.selectConferenceHint')}
              type="info"
              showIcon
            />
          )}

          {selectedConferenceId && (
            <>
              <Card title={t('trackManagement.createTitle')} size="small">
                <div style={styles.formRow}>
                  <Input
                    placeholder={t('trackManagement.createTrackNamePlaceholder')}
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    disabled={isMutating}
                  />
                  <Input
                    placeholder={t('trackManagement.createDescriptionPlaceholder')}
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    disabled={isMutating}
                  />
                  <InputNumber
                    placeholder={t('trackManagement.createMinRevPlaceholder')}
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
                    {t('trackManagement.actions.create')}
                  </Button>
                </div>
              </Card>

              {isLoading ? (
                <Spin size="large" tip={t('trackManagement.loading')} />
              ) : (
                <Table
                  columns={columns}
                  dataSource={tracks}
                  rowKey="id"
                  scroll={{ x: 1200 }}
                  pagination={{ pageSize: 15 }}
                  locale={{
                    emptyText: t('trackManagement.empty'),
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
