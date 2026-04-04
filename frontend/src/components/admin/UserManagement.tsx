import { useEffect, useState } from 'react';
import { Table, Select, Button, Input, Typography, Card, Row, Col, Pagination, Modal, Form, Space } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useDeleteUser, useCreateUser } from '../../hooks/useUser';
import { AccountStatusOptions, RoleOptions } from '../../constants';
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack';
import type { ColumnsType } from 'antd/es/table';
import type { UserDto } from '../../models';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

const styles = {
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  createForm: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    alignItems: 'flex-end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    minWidth: '220px',
    flex: '1 1 220px',
  },
} as const;

const PAGE_SIZE = 10;

const UserManagement = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(0);
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data, isLoading, isFetching } = useUsers(
    page,
    PAGE_SIZE,
    {
      name: filterName,
      email: filterEmail,
      role: filterRole,
      status: filterStatus,
    },
    true
  );
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const createUser = useCreateUser();
  const institutionsQuery = useInstitutions(0, 100);
  const tracksQuery = useTracks();

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<string>('USER');
  const [newInstitutionId, setNewInstitutionId] = useState<string>('');
  const [newTrackId, setNewTrackId] = useState<string>('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

  const users = data?.data?.content ?? [];
  const pageMeta = data?.data;

  const handleRoleChange = (userId: string, currentRole: string, nextRole?: string) => {
    if (!nextRole || nextRole === currentRole) return;
    updateRole.mutate({ id: userId, data: { role: nextRole } });
  };

  const handleStatusChange = (userId: string, currentStatus?: string, nextStatus?: string) => {
    if (!nextStatus || nextStatus === currentStatus) return;
    updateStatus.mutate({ id: userId, data: { status: nextStatus } });
  };

  const handleDelete = (userId: string) => {
    deleteUser.mutate(userId);
  };

  const handleOpenDetail = (user: UserDto) => {
    setSelectedUser(user);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedUser(null);
  };

  const handleCreate = () => {
    const name = newName.trim();
    const email = newEmail.trim();
    const role = newRole;
    const institutionId = newInstitutionId.trim();
    const trackId = newTrackId.trim();

    if (!name || !email || !role) return;
    if (role === 'EDITOR' && !trackId) return;

    createUser.mutate(
      {
        name,
        email,
        role,
        institutionId: institutionId || null,
        trackId: trackId || null,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewEmail('');
          setNewRole('USER');
          setNewInstitutionId('');
          setNewTrackId('');
          setPage(0);
        },
      }
    );
  };

  const isMutating =
    updateRole.isPending || updateStatus.isPending || deleteUser.isPending || createUser.isPending;

  const institutions = institutionsQuery.data?.data?.content ?? [];
  const tracks = tracksQuery.data?.data ?? [];

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilterName(inputName.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [inputName]);

  useEffect(() => {
    const handle = setTimeout(() => {
      setFilterEmail(inputEmail.trim());
      setPage(0);
    }, 300);
    return () => clearTimeout(handle);
  }, [inputEmail]);

  const columns: ColumnsType<UserDto> = [
    {
      title: t('userManagement.columns.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('userManagement.columns.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('userManagement.columns.role'),
      key: 'role',
      render: (_, record) => (
        <Select
          size="small"
          value={record.role}
          disabled={updateRole.isPending}
          onChange={(value) => handleRoleChange(record.id, record.role, value)}
          options={RoleOptions.map((role) => ({ value: role.value, label: role.label }))}
          style={{ width: '140px' }}
        />
      ),
    },
    {
      title: t('userManagement.columns.status'),
      key: 'status',
      render: (_, record) => (
        <Select
          size="small"
          value={record.status || 'INACTIVE'}
          disabled={updateStatus.isPending}
          onChange={(value) => handleStatusChange(record.id, record.status, value)}
          options={AccountStatusOptions.map((status) => ({ value: status.value, label: status.label }))}
          style={{ width: '140px' }}
        />
      ),
    },
    {
      title: t('userManagement.columns.actions'),
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button onClick={() => handleOpenDetail(record)}>{t('userManagement.actions.detail')}</Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            disabled={deleteUser.isPending}
          >
            {t('userManagement.actions.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Text strong style={{ fontSize: '24px' }}>
          {t('userManagement.title')}
        </Text>
        <Pagination
          current={page + 1}
          total={(pageMeta?.totalPages ?? 1) * PAGE_SIZE}
          pageSize={PAGE_SIZE}
          onChange={(newPage) => setPage(newPage - 1)}
          disabled={isLoading || isMutating}
          showSizeChanger={false}
        />
      </div>

      <Card title={t('userManagement.create.title')}>
        <div style={styles.createForm}>
          <div style={styles.field}>
            <Text>{t('userManagement.create.nameLabel')}</Text>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t('userManagement.create.namePlaceholder')}
              disabled={isMutating}
            />
          </div>
          <div style={styles.field}>
            <Text>{t('userManagement.create.emailLabel')}</Text>
            <Input
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder={t('userManagement.create.emailPlaceholder')}
              disabled={isMutating}
            />
          </div>
          <div style={styles.field}>
            <Text>{t('userManagement.create.roleLabel')}</Text>
            <Select
              value={newRole}
              onChange={setNewRole}
              disabled={isMutating}
              options={RoleOptions.map((role) => ({ value: role.value, label: role.label }))}
              style={{ width: '100%' }}
            />
          </div>
          <div style={styles.field}>
            <Text>{t('userManagement.create.institutionLabel')}</Text>
            <Select
              value={newInstitutionId || undefined}
              onChange={(value) => setNewInstitutionId(value || '')}
              disabled={isMutating || institutionsQuery.isLoading}
              placeholder={
                institutionsQuery.isLoading
                  ? t('userManagement.create.loading')
                  : t('userManagement.create.institutionPlaceholder')
              }
              options={[
                { value: '', label: t('userManagement.create.noneOption') },
                ...institutions.map((inst) => ({ value: inst.id, label: inst.name })),
              ]}
              style={{ width: '100%' }}
              allowClear
            />
          </div>
          <div style={styles.field}>
            <Text>
              {newRole === 'EDITOR'
                ? t('userManagement.create.trackRequiredLabel')
                : t('userManagement.create.trackOptionalLabel')}
            </Text>
            <Select
              value={newTrackId || undefined}
              onChange={(value) => setNewTrackId(value || '')}
              disabled={isMutating || tracksQuery.isLoading}
              placeholder={
                tracksQuery.isLoading
                  ? t('userManagement.create.loading')
                  : t('userManagement.create.trackPlaceholder')
              }
              options={[
                { value: '', label: t('userManagement.create.noneOption') },
                ...tracks.map((track) => ({ value: track.id, label: track.name })),
              ]}
              style={{ width: '100%' }}
              allowClear
            />
          </div>
          <Button
            type="primary"
            onClick={handleCreate}
            disabled={
              isMutating ||
              !newName.trim() ||
              !newEmail.trim() ||
              (newRole === 'EDITOR' && !newTrackId.trim())
            }
          >
            {t('userManagement.actions.create')}
          </Button>
        </div>
      </Card>

      <Card>
        <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={12} md={6}>
            <Text strong>{t('userManagement.filters.nameLabel')}</Text>
            <Input
              size="small"
              placeholder={t('userManagement.filters.namePlaceholder')}
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>{t('userManagement.filters.emailLabel')}</Text>
            <Input
              size="small"
              placeholder={t('userManagement.filters.emailPlaceholder')}
              value={inputEmail}
              onChange={(e) => setInputEmail(e.target.value)}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>{t('userManagement.filters.roleLabel')}</Text>
            <Select
              size="small"
              value={filterRole || undefined}
              onChange={(value) => {
                setFilterRole(value || '');
                setPage(0);
              }}
              placeholder={t('userManagement.filters.all')}
              options={[
                { value: '', label: t('userManagement.filters.all') },
                ...RoleOptions.map((role) => ({ value: role.value, label: role.label })),
              ]}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Text strong>{t('userManagement.filters.statusLabel')}</Text>
            <Select
              size="small"
              value={filterStatus || undefined}
              onChange={(value) => {
                setFilterStatus(value || '');
                setPage(0);
              }}
              placeholder={t('userManagement.filters.all')}
              options={[
                { value: '', label: t('userManagement.filters.all') },
                ...AccountStatusOptions.map((status) => ({ value: status.value, label: status.label })),
              ]}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={isLoading || isFetching}
          locale={{
            emptyText: t('userManagement.empty'),
          }}
          pagination={false}
        />
      </Card>

      <Modal
        title={t('userManagement.detail.title')}
        open={detailOpen}
        onCancel={handleCloseDetail}
        footer={[
          <Button key="close" onClick={handleCloseDetail}>
            {t('userManagement.detail.close')}
          </Button>,
        ]}
        destroyOnClose
      >
        <Form layout="vertical" disabled>
          <Form.Item label={t('userManagement.detail.id')}>
            <Input value={selectedUser?.id ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.name')}>
            <Input value={selectedUser?.name ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.email')}>
            <Input value={selectedUser?.email ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.primaryRole')}>
            <Input value={selectedUser?.role ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.allRoles')}>
            <Input value={(selectedUser?.roles ?? []).join(', ')} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.status')}>
            <Input value={selectedUser?.status ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.institution')}>
            <Input value={selectedUser?.institution?.name ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.track')}>
            <Input value={selectedUser?.track?.name ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.gender')}>
            <Input value={selectedUser?.gender ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.nationality')}>
            <Input value={selectedUser?.nationality ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.academicStatus')}>
            <Input value={selectedUser?.academicStatus ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.createdAt')}>
            <Input value={selectedUser?.createdAt ?? ''} />
          </Form.Item>
          <Form.Item label={t('userManagement.detail.updatedAt')}>
            <Input value={selectedUser?.updatedAt ?? ''} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
