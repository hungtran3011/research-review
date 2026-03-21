import { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Typography,
  Card,
  Space,
  DatePicker,
  Select,
  InputNumber,
  Modal,
} from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { conferenceService } from '../../services/conference.service';
import { ConferenceStatusOptions } from '../../constants';
import type { ColumnsType } from 'antd/es/table';
import type {
  ConferenceDto,
  ConferenceCreateRequestDto,
  ConferenceUpdateRequestDto,
  ConferenceStatus,
} from '../../models';
import dayjs from 'dayjs';
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
  buttonRow: {
    gridColumn: '1 / -1',
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
} as const;

const ConferenceManagement = () => {
  const queryClient = useQueryClient();
  const { success, error } = useBasicToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // Form fields for create/edit
  const [formName, setFormName] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formSeason, setFormSeason] = useState('');
  const [formYear, setFormYear] = useState<number | null>(null);
  const [formDescription, setFormDescription] = useState('');
  const [formStatus, setFormStatus] = useState<ConferenceStatus>('DRAFT' as ConferenceStatus);
  const [formDeadline, setFormDeadline] = useState<dayjs.Dayjs | null>(null);
  const [formMinReviews, setFormMinReviews] = useState(3);

  // Query for fetching conferences
  const conferencesQuery = useQuery({
    queryKey: ['conferences'],
    queryFn: async () => {
      const response = await conferenceService.getAll();
      return response.data || [];
    },
  });

  const conferences = conferencesQuery.data || [];
  const isLoading = conferencesQuery.isLoading;

  // Create mutation
  const createConference = useMutation({
    mutationFn: async (data: ConferenceCreateRequestDto) => {
      return await conferenceService.create(data);
    },
    onSuccess: () => {
      success('Đã tạo hội nghị thành công');
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
      resetForm();
      setIsModalVisible(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Tạo hội nghị thất bại: ' + message);
    },
  });

  // Update mutation
  const updateConference = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ConferenceUpdateRequestDto }) => {
      return await conferenceService.update(id, data);
    },
    onSuccess: () => {
      success('Đã cập nhật hội nghị thành công');
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
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
      error('Cập nhật hội nghị thất bại: ' + message);
    },
  });

  // Delete mutation
  const deleteConference = useMutation({
    mutationFn: async (id: string) => {
      return await conferenceService.delete(id);
    },
    onSuccess: () => {
      success('Đã xóa hội nghị thành công');
      queryClient.invalidateQueries({ queryKey: ['conferences'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error 
        ? err.message 
        : typeof err === 'object' && err !== null && 'response' in err 
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Unknown error'
        : 'Unknown error';
      error('Xóa hội nghị thất bại: ' + message);
    },
  });

  const isMutating =
    createConference.isPending || updateConference.isPending || deleteConference.isPending;

  const resetForm = () => {
    setFormName('');
    setFormShortName('');
    setFormSeason('');
    setFormYear(null);
    setFormDescription('');
    setFormStatus('DRAFT' as ConferenceStatus);
    setFormDeadline(null);
    setFormMinReviews(3);
  };

  const handleCreate = () => {
    resetForm();
    setEditingId(null);
    setIsModalVisible(true);
  };

  const handleEdit = (conference: ConferenceDto) => {
    setEditingId(conference.id);
    setFormName(conference.name);
    setFormShortName(conference.shortName);
    setFormSeason(conference.season || '');
    setFormYear(conference.year || null);
    setFormDescription(conference.description || '');
    setFormStatus(conference.status);
    setFormDeadline(conference.submissionDeadline ? dayjs(conference.submissionDeadline) : null);
    setFormMinReviews(conference.minimumCompletedReviews);
    setIsModalVisible(true);
  };

  const handleSubmit = () => {
    if (!formName.trim() || !formShortName.trim()) {
      error('Tên và mã ngắn là bắt buộc');
      return;
    }

    const payload = {
      name: formName.trim(),
      shortName: formShortName.trim(),
      season: formSeason.trim() || null,
      year: formYear,
      description: formDescription.trim() || null,
      status: formStatus,
      submissionDeadline: formDeadline ? formDeadline.toISOString() : null,
      minimumCompletedReviews: formMinReviews,
    };

    if (editingId) {
      updateConference.mutate({ id: editingId, data: payload });
    } else {
      createConference.mutate(payload);
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa hội nghị này không?',
      onOk: () => deleteConference.mutate(id),
      okText: 'Xóa',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
    });
  };

  const columns: ColumnsType<ConferenceDto> = [
    {
      title: 'Tên hội nghị',
      dataIndex: 'name',
      key: 'name',
      width: '20%',
    },
    {
      title: 'Mã ngắn',
      dataIndex: 'shortName',
      key: 'shortName',
      width: '12%',
    },
    {
      title: 'Mùa/Năm',
      key: 'season',
      width: '12%',
      render: (_, record) => {
        const parts: string[] = [];
        if (record.season) parts.push(record.season);
        if (record.year) parts.push(record.year.toString());
        return parts.length > 0 ? parts.join(' ') : '-';
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status: ConferenceStatus) => {
        const option = ConferenceStatusOptions.find((s) => s.value === status);
        return option?.label || status;
      },
    },
    {
      title: 'Hạn nộp',
      key: 'deadline',
      width: '14%',
      render: (_, record) => {
        return record.submissionDeadline
          ? dayjs(record.submissionDeadline).format('DD/MM/YYYY HH:mm')
          : '-';
      },
    },
    {
      title: 'SL Review',
      dataIndex: 'minimumCompletedReviews',
      key: 'minReviews',
      width: '10%',
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: '20%',
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
        <div style={styles.header}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Text strong style={{ fontSize: '24px' }}>
              Quản lý Hội nghị
            </Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo hội nghị mới
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={conferences}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: 'Không có hội nghị nào',
          }}
        />
      </Card>

      <Modal
        title={editingId ? 'Chỉnh sửa hội nghị' : 'Tạo hội nghị mới'}
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
        width={800}
      >
        <div style={{ ...styles.formGrid, marginTop: '24px' }}>
          <div style={styles.field}>
            <Text strong>Tên hội nghị *</Text>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="VD: AI Summit 2026"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Mã ngắn *</Text>
            <Input
              value={formShortName}
              onChange={(e) => setFormShortName(e.target.value)}
              placeholder="VD: AI2026"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Mùa</Text>
            <Input
              value={formSeason}
              onChange={(e) => setFormSeason(e.target.value)}
              placeholder="VD: Spring, Fall"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Năm</Text>
            <InputNumber
              value={formYear}
              onChange={(value) => setFormYear(value)}
              placeholder="VD: 2026"
              min={1900}
              max={9999}
              style={{ width: '100%' }}
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Trạng thái *</Text>
            <Select
              value={formStatus}
              onChange={setFormStatus}
              options={ConferenceStatusOptions}
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Hạn nộp bài</Text>
            <DatePicker
              value={formDeadline}
              onChange={setFormDeadline}
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
              placeholder="Chọn thời hạn"
              disabled={isMutating}
            />
          </div>

          <div style={styles.field}>
            <Text strong>Số review tối thiểu</Text>
            <InputNumber
              value={formMinReviews}
              onChange={(value) => setFormMinReviews(value || 3)}
              min={1}
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
              placeholder="Mô tả chi tiết về hội nghị"
              disabled={isMutating}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ConferenceManagement;
