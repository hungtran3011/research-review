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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
      if (!selectedConferenceId) throw new Error(t('topicManagement.errors.selectConferenceFirst'));
      return await topicService.create(selectedConferenceId, data);
    },
    onSuccess: () => {
      success(t('topicManagement.messages.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      resetForm();
      setIsModalVisible(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('topicManagement.messages.unknownError')
        : t('topicManagement.messages.unknownError');
      error(t('topicManagement.messages.createFailedPrefix') + message);
    },
  });

  // Update mutation
  const updateTopic = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TopicUpdateRequestDto }) => {
      if (!selectedConferenceId) throw new Error(t('topicManagement.errors.selectConferenceFirst'));
      return await topicService.update(selectedConferenceId, id, data);
    },
    onSuccess: () => {
      success(t('topicManagement.messages.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      resetForm();
      setIsModalVisible(false);
      setEditingId(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('topicManagement.messages.unknownError')
        : t('topicManagement.messages.unknownError');
      error(t('topicManagement.messages.updateFailedPrefix') + message);
    },
  });

  // Delete mutation
  const deleteTopic = useMutation({
    mutationFn: async (id: string) => {
      if (!selectedConferenceId) throw new Error(t('topicManagement.errors.selectConferenceFirst'));
      return await topicService.delete(selectedConferenceId, id);
    },
    onSuccess: () => {
      success(t('topicManagement.messages.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['topics'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || t('topicManagement.messages.unknownError')
        : t('topicManagement.messages.unknownError');
      error(t('topicManagement.messages.deleteFailedPrefix') + message);
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
      error(t('topicManagement.errors.selectConferenceFirst'));
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
      error(t('topicManagement.errors.topicNameRequired'));
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
      title: t('topicManagement.confirmDelete.title'),
      content: t('topicManagement.confirmDelete.content'),
      onOk: () => deleteTopic.mutate(id),
      okText: t('topicManagement.actions.delete'),
      cancelText: t('topicManagement.actions.cancel'),
      okButtonProps: { danger: true },
    });
  };

  const columns: ColumnsType<TopicDto> = [
    {
      title: t('topicManagement.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: t('topicManagement.columns.track'),
      key: 'track',
      width: '20%',
      render: (_, record) => {
        if (!record.trackId) return <Text type="secondary">{t('topicManagement.common.conferenceWide')}</Text>;
        const track = tracks.find((t) => t.id === record.trackId);
        return track?.name || record.trackId;
      },
    },
    {
      title: t('topicManagement.columns.description'),
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      render: (desc: string | null) => desc || t('topicManagement.common.dash'),
    },
    {
      title: t('topicManagement.columns.orderIndex'),
      dataIndex: 'orderIndex',
      key: 'orderIndex',
      width: '10%',
    },
    {
      title: t('topicManagement.columns.active'),
      key: 'isActive',
      width: '10%',
      render: (_, record) => <Switch checked={record.isActive} disabled />,
    },
    {
      title: t('topicManagement.columns.actions'),
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
            {t('topicManagement.actions.edit')}
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={isMutating}
          >
            {t('topicManagement.actions.delete')}
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
              {t('topicManagement.title')}
            </Text>
          </div>

          <Space direction="vertical" style={{ width: '100%' }}>
            <div style={styles.field}>
              <Text strong>{t('topicManagement.selectConferenceLabel')}</Text>
              <Select
                value={selectedConferenceId || undefined}
                onChange={(value) => {
                  setSelectedConferenceId(value);
                  setSelectedTrackFilter(undefined);
                }}
                placeholder={t('topicManagement.selectConferencePlaceholder')}
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
                <Text strong>{t('topicManagement.filterByTrackLabel')}</Text>
                <Select
                  value={selectedTrackFilter}
                  onChange={setSelectedTrackFilter}
                  placeholder={t('topicManagement.filterByTrackPlaceholder')}
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
              message={t('topicManagement.selectConferenceHint')}
              type="info"
              showIcon
            />
          )}

          {selectedConferenceId && (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('topicManagement.actions.createNew')}
                </Button>
              </div>

              <Table
                columns={columns}
                dataSource={topics}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 15 }}
                locale={{
                  emptyText: t('topicManagement.empty'),
                }}
              />
            </>
          )}
        </Space>
      </Card>

      <Modal
        title={editingId ? t('topicManagement.modal.editTitle') : t('topicManagement.modal.createTitle')}
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
            {t('topicManagement.actions.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleSubmit} loading={isMutating}>
            {editingId ? t('topicManagement.actions.update') : t('topicManagement.actions.create')}
          </Button>,
        ]}
        width={700}
      >
        <div style={{ ...styles.formGrid, marginTop: '24px' }}>
          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <Text strong>{t('topicManagement.form.nameLabel')}</Text>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t('topicManagement.form.namePlaceholder')}
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>{t('topicManagement.form.trackLabel')}</Text>
            <Select
              value={formTrackId}
              onChange={setFormTrackId}
              placeholder={t('topicManagement.form.trackPlaceholder')}
              allowClear
              disabled={isMutating || tracksQuery.isLoading}
              options={tracks.map((track) => ({
                value: track.id,
                label: track.name,
              }))}
            />
          </div>

          <div style={styles.field}>
            <Text strong>{t('topicManagement.form.orderIndexLabel')}</Text>
            <InputNumber
              value={formOrderIndex}
              onChange={(value) => setFormOrderIndex(value || 0)}
              min={0}
              style={{ width: '100%' }}
              disabled={isMutating}
            />
          </div>

          <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
            <Text strong>{t('topicManagement.form.descriptionLabel')}</Text>
            <Input.TextArea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              placeholder={t('topicManagement.form.descriptionPlaceholder')}
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Space>
              <Switch checked={formIsActive} onChange={setFormIsActive} disabled={isMutating} />
              <Text>{t('topicManagement.form.activeLabel')}</Text>
            </Space>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TopicManagement;
