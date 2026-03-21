import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Switch,
  Typography,
  Card,
  Space,
  Select,
  InputNumber,
  Modal,
  Alert,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceService } from '../../services/conference.service';
import { topicService } from '../../services/topic.service';
import { adminTrackService } from '../../services/admin-track.service';
import type { ColumnsType } from 'antd/es/table';
import type { TopicDto, TopicCreateRequestDto, TopicUpdateRequestDto } from '../../models';
import { useBasicToast } from '../../hooks/useBasicToast';

const { Text } = Typography;

const styles = {
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  header: {
    marginBottom: '16px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
} as const;

const TopicManagement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();
  const [selectedConferenceId, setSelectedConferenceId] = useState<string>('');
  const [selectedTrackFilter, setSelectedTrackFilter] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Form fields for create/edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formOrderIndex, setFormOrderIndex] = useState(0);
  const [formTrackId, setFormTrackId] = useState<string | undefined>(undefined);

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

  const tracks = tracksQuery.data || [];

  // Query for fetching topics
  const topicsQuery = useQuery({
    queryKey: ['topics', selectedConferenceId, selectedTrackFilter],
    queryFn: async () => {
      if (!selectedConferenceId) return [];
      const response = await topicService.getAll(selectedConferenceId, selectedTrackFilter);
      return response.data || [];
    },
    enabled: !!selectedConferenceId,
  });

  const topics = topicsQuery.data || [];
  const isLoading = topicsQuery.isLoading;

  // Create mutation
  const createTopic = useMutation({
    mutationFn: async (data: TopicCreateRequestDto) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await topicService.create(selectedConferenceId, data);
    },
    onSuccess: () => {
      success('Đã tạo chủ đề thành công');
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      resetForm();
      setIsModalVisible(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Tạo chủ đề thất bại: ' + message);
    },
  });

  // Update mutation
  const updateTopic = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TopicUpdateRequestDto }) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await topicService.update(selectedConferenceId, id, data);
    },
    onSuccess: () => {
      success('Đã cập nhật chủ đề thành công');
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      resetForm();
      setIsModalVisible(false);
      setEditingId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Cập nhật chủ đề thất bại: ' + message);
    },
  });

  // Delete mutation
  const deleteTopic = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedConferenceId) throw new Error('No conference selected');
      return await topicService.delete(selectedConferenceId, id);
    },
    onSuccess: () => {
      success('Đã xóa chủ đề thành công');
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Xóa chủ đề thất bại: ' + message);
    },
  });

  const isMutating = createTopic.isPending || updateTopic.isPending || deleteTopic.isPending;

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setFormOrderIndex(0);
    setFormTrackId(undefined);
  };

  const handleCreate = () => {
    if (!selectedConferenceId) {
      error('Vui lòng chọn hội nghị trước');
      return;
    }
    resetForm();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (topic: TopicDto) => {
    setEditingId(topic.id);
    setFormName(topic.name);
    setFormDescription(topic.description || '');
    setFormIsActive(topic.isActive);
    setFormOrderIndex(topic.orderIndex);
    setFormTrackId(topic.trackId || undefined);
    setIsModalVisible(true);
  };

  const handleSubmit = () => {
    if (!formName.trim()) {
      error('Tên chủ đề là bắt buộc');
      return;
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim() || null,
      isActive: formIsActive,
      orderIndex: formOrderIndex,
      trackId: formTrackId || null,
    };

    if (editingId) {
      updateTopic.mutate({ id: editingId, data: payload });
    } else {
      createTopic.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa chủ đề này không?',
      onOk: () => deleteTopic.mutate(id),
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
    });
  };

  const columns: ColumnsType<TopicDto> = [
    {
      title: 'Tên chủ đề',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: 'Track',
      key: 'track',
      width: '20%',
      render: (_, record) => {
        if (!record.trackId) return <Text type="secondary">- (Chung conference) -</Text>;
        const track = tracks.find((t) => t.id === record.trackId);
        return track?.name || record.trackId;
      },
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      render: (desc: string | null) => desc || '-',
    },
    {
      title: 'Thứ tự',
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: '10%',
    },
    {
      title: 'Kích hoạt',
      key: 'isActive',
      width: '10%',
      render: (_, record) => <Switch checked={record.isActive} disabled />,
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: '15%',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={isMutating}
          >
            Sửa
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={isMutating}
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
              Quản lý Chủ đề (Topic)
            </Text>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={styles.field}>
              <Text strong>Chọn hội nghị *</Text>
              <Select
                value={selectedConferenceId || undefined}
                onChange={(value) => {
                  setSelectedConferenceId(value);
                  setSelectedTrackFilter(undefined);
                }}
                placeholder="Chọn hội nghị để quản lý topics"
                loading={conferencesQuery.isLoading}
                options={conferences.map((conf) => ({
                  value: conf.id,
                  label: `${conf.name} (${conf.shortName})`,
                }))}
                style={{ width: '100%', maxWidth: '600px' }}
              />
            </div>

            {selectedConferenceId && (
              <div style={styles.field}>
                <Text strong>Lọc theo Track (tùy chọn)</Text>
                <Select
                  value={selectedTrackFilter}
                  onChange={setSelectedTrackFilter}
                  placeholder="Tất cả các topics"
                  allowClear
                  loading={tracksQuery.isLoading}
                  options={tracks.map((track) => ({
                    value: track.id,
                    label: track.name,
                  }))}
                  style={{ width: '100%', maxWidth: '600px' }}
                />
              </div>
            )}
          </Space>

          {!selectedConferenceId && (
            <Alert
              message="Vui lòng chọn hội nghị để xem và quản lý các chủ đề"
              type="info"
              showIcon
            />
          )}

          {selectedConferenceId && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Tạo chủ đề mới
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={topics}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 15 }}
                locale={{
                  emptyText: 'Không có chủ đề nào',
                }}
              />
            </>
          )}
        </Space>
      </Card>

      <Modal
        title={editingId ? 'Chỉnh sửa chủ đề' : 'Tạo chủ đề mới'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          resetForm();
          setEditingId(null);
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setIsModalVisible(false);
              resetForm();
              setEditingId(null);
            }}
          >
            Hủy
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isMutating}>
            {editingId ? 'Cập nhật' : 'Tạo mới'}
          </Button>,
        ]}
        width={700}
      >
        <div style={{ ...styles.formGrid, marginTop: '24px' }}>
          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <Text strong>Tên chủ đề *</Text>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: Machine Learning, Natural Language Processing"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Track (tùy chọn)</Text>
            <Select
              value={formTrackId}
              onChange={setFormTrackId}
              placeholder="Chung cho cả conference"
              allowClear
              disabled={isMutating || tracksQuery.isLoading}
              options={tracks.map((track) => ({
                value: track.id,
                label: track.name,
              }))}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Thứ tự hiển thị</Text>
            <InputNumber
              value={formOrderIndex}
              onChange={(value) => setFormOrderIndex(value || 0)}
              min={0}
              style={{ width: '100%' }}
              disabled={isMutating}
            />
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <Text strong>Mô tả</Text>
            <Input.TextArea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả chi tiết về chủ đề"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Space>
              <Switch checked={formIsActive} onChange={setFormIsActive} disabled={isMutating} />
              <Text>Kích hoạt</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TopicManagement;
