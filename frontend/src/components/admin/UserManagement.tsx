import { useEffect, useState } from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dropdown,
  Option,
  Button,
  Input,
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete16Regular } from '@fluentui/react-icons';
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useDeleteUser, useCreateUser } from '../../hooks/useUser';
import { AccountStatusOptions, RoleOptions } from '../../constants';
import { useInstitutions, useTracks } from '../../hooks/useInstitutionTrack';

const useStyles = makeStyles({
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  createSection: {
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  pagination: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  tableCard: {
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  filterBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    padding: '12px 12px 0 12px',
  },
  tableWrapper: {
    overflowX: 'auto',
    padding: '0 12px 12px 12px',
  },
  createForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'end',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: '220px',
    flex: '1 1 220px',
  },
});

const PAGE_SIZE = 10;
const NONE_OPTION_VALUE = '__NONE__';

const UserManagement = () => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const [inputName, setInputName] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const { data, isLoading } = useUsers(
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

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size={600} weight="semibold">
          Quản lý người dùng
        </Text>
        <div className={classes.pagination}>
          <Button
            disabled={page === 0 || isLoading || isMutating}
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
          >
            Trang trước
          </Button>
          <Text>
            Trang {page + 1} / {Math.max(pageMeta?.totalPages ?? 1, 1)}
          </Text>
          <Button
            disabled={
              isLoading ||
              isMutating ||
              !pageMeta?.hasNext
            }
            onClick={() => setPage((prev) => prev + 1)}
          >
            Trang tiếp
          </Button>
        </div>
      </div>

      <div className={classes.createSection}>
        <Text weight="semibold">Tạo người dùng mới</Text>
        <div className={classes.createForm}>
          <div className={classes.field}>
            <Text size={300}>Họ tên</Text>
            <Input
              value={newName}
              onChange={(_ev, data) => setNewName(data.value)}
              placeholder="Nhập họ tên"
              disabled={isMutating}
            />
          </div>
          <div className={classes.field}>
            <Text size={300}>Email</Text>
            <Input
              value={newEmail}
              onChange={(_ev, data) => setNewEmail(data.value)}
              placeholder="Nhập email"
              disabled={isMutating}
            />
          </div>
          <div className={classes.field}>
            <Text size={300}>Vai trò</Text>
            <Dropdown
              value={RoleOptions.find(r => r.value === newRole)?.label || 'USER'}
              selectedOptions={[newRole]}
              onOptionSelect={(_ev, data) => setNewRole(data.optionValue || 'USER')}
              disabled={isMutating}
            >
              {RoleOptions.map((role) => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={classes.field}>
            <Text size={300}>Nơi công tác (tùy chọn)</Text>
            <Dropdown
              value={
                newInstitutionId
                  ? institutions.find(i => i.id === newInstitutionId)?.name || 'Chọn nơi công tác'
                  : '(Không chọn)'
              }
              selectedOptions={[newInstitutionId || NONE_OPTION_VALUE]}
              onOptionSelect={(_ev, data) => {
                const next = data.optionValue ?? NONE_OPTION_VALUE;
                setNewInstitutionId(next === NONE_OPTION_VALUE ? '' : next);
              }}
              disabled={isMutating || institutionsQuery.isLoading}
              placeholder={institutionsQuery.isLoading ? 'Đang tải...' : 'Chọn nơi công tác'}
            >
              <Option value={NONE_OPTION_VALUE}>(Không chọn)</Option>
              {institutions.map((inst) => (
                <Option key={inst.id} value={inst.id}>
                  {inst.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          <div className={classes.field}>
            <Text size={300}>
              Track {newRole === 'EDITOR' ? '(bắt buộc cho Editor)' : '(tùy chọn)'}
            </Text>
            <Dropdown
              value={
                newTrackId
                  ? tracks.find(t => t.id === newTrackId)?.name || 'Chọn track'
                  : '(Không chọn)'
              }
              selectedOptions={[newTrackId || NONE_OPTION_VALUE]}
              onOptionSelect={(_ev, data) => {
                const next = data.optionValue ?? NONE_OPTION_VALUE;
                setNewTrackId(next === NONE_OPTION_VALUE ? '' : next);
              }}
              disabled={isMutating || tracksQuery.isLoading}
              placeholder={tracksQuery.isLoading ? 'Đang tải...' : 'Chọn track'}
            >
              <Option value={NONE_OPTION_VALUE}>(Không chọn)</Option>
              {tracks.map((track) => (
                <Option key={track.id} value={track.id}>
                  {track.name}
                </Option>
              ))}
            </Dropdown>
          </div>
          <Button
            appearance="primary"
            onClick={handleCreate}
            disabled={
              isMutating ||
              !newName.trim() ||
              !newEmail.trim() ||
              (newRole === 'EDITOR' && !newTrackId.trim())
            }
          >
            Tạo người dùng
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner label="Đang tải danh sách người dùng..." />
      ) : (
        <div className={classes.tableCard}>
          <div className={classes.filterBar}>
            <div className={classes.field}>
              <Text size={300} weight="semibold">Họ tên</Text>
              <Input
                size="small"
                placeholder="Lọc theo tên"
                value={inputName}
                onChange={(_e, d) => setInputName(d.value)}
              />
            </div>
            <div className={classes.field}>
              <Text size={300} weight="semibold">Email</Text>
              <Input
                size="small"
                placeholder="Lọc theo email"
                value={inputEmail}
                onChange={(_e, d) => setInputEmail(d.value)}
              />
            </div>
            <div className={classes.field}>
              <Text size={300} weight="semibold">Vai trò</Text>
              <Dropdown
                size="small"
                value={
                  filterRole
                    ? RoleOptions.find(r => r.value === filterRole)?.label || 'Tất cả'
                    : 'Tất cả'
                }
                selectedOptions={[filterRole || NONE_OPTION_VALUE]}
                onOptionSelect={(_e, d) => {
                  const next = d.optionValue ?? NONE_OPTION_VALUE;
                  setFilterRole(next === NONE_OPTION_VALUE ? '' : next);
                  setPage(0);
                }}
              >
                <Option value={NONE_OPTION_VALUE}>Tất cả</Option>
                {RoleOptions.map((role) => (
                  <Option key={role.value} value={role.value}>
                    {role.label}
                  </Option>
                ))}
              </Dropdown>
            </div>
            <div className={classes.field}>
              <Text size={300} weight="semibold">Trạng thái</Text>
              <Dropdown
                size="small"
                value={
                  filterStatus
                    ? AccountStatusOptions.find(s => s.value === filterStatus)?.label || 'Tất cả'
                    : 'Tất cả'
                }
                selectedOptions={[filterStatus || NONE_OPTION_VALUE]}
                onOptionSelect={(_e, d) => {
                  const next = d.optionValue ?? NONE_OPTION_VALUE;
                  setFilterStatus(next === NONE_OPTION_VALUE ? '' : next);
                  setPage(0);
                }}
              >
                <Option value={NONE_OPTION_VALUE}>Tất cả</Option>
                {AccountStatusOptions.map((status) => (
                  <Option key={status.value} value={status.value}>
                    {status.label}
                  </Option>
                ))}
              </Dropdown>
            </div>
          </div>

          <div className={classes.tableWrapper}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Họ tên</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Vai trò</TableHeaderCell>
                  <TableHeaderCell>Trạng thái</TableHeaderCell>
                  <TableHeaderCell>Hành động</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Dropdown
                        size="small"
                        value={RoleOptions.find(r => r.value === user.role)?.label || user.role}
                        disabled={updateRole.isPending}
                        selectedOptions={[user.role]}
                        onOptionSelect={(_ev, data) =>
                          handleRoleChange(user.id, user.role, data.optionValue)
                        }
                      >
                        {RoleOptions.map((role) => (
                          <Option key={role.value} value={role.value}>
                            {role.label}
                          </Option>
                        ))}
                      </Dropdown>
                    </TableCell>
                    <TableCell>
                      <Dropdown
                        size="small"
                        value={AccountStatusOptions.find(s => s.value === user.status)?.label || user.status || 'INACTIVE'}
                        disabled={updateStatus.isPending}
                        selectedOptions={[user.status || 'INACTIVE']}
                        onOptionSelect={(_ev, data) =>
                          handleStatusChange(user.id, user.status, data.optionValue)
                        }
                      >
                        {AccountStatusOptions.map((status) => (
                          <Option key={status.value} value={status.value}>
                            {status.label}
                          </Option>
                        ))}
                      </Dropdown>
                    </TableCell>
                    <TableCell>
                      <Button
                        appearance="secondary"
                        icon={<Delete16Regular />}
                        onClick={() => handleDelete(user.id)}
                        disabled={deleteUser.isPending}
                      >
                        Xóa
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {users.length === 0 && (
              <Text style={{ padding: '12px', display: 'block' }}>
                Không có người dùng nào phù hợp bộ lọc.
              </Text>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
