import { useState } from 'react';
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
  Spinner,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete16Regular } from '@fluentui/react-icons';
import { useUsers, useUpdateUserRole, useUpdateUserStatus, useDeleteUser } from '../../hooks/useUser';
import { AccountStatusOptions, RoleOptions } from '../../constants';

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
  pagination: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

const PAGE_SIZE = 10;

const UserManagement = () => {
  const classes = useStyles();
  const [page, setPage] = useState(0);
  const { data, isLoading } = useUsers(page, PAGE_SIZE, true);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

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

  const isMutating =
    updateRole.isPending || updateStatus.isPending || deleteUser.isPending;

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

      {isLoading ? (
        <Spinner label="Đang tải danh sách người dùng..." />
      ) : (
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
            <Text style={{ padding: '16px', display: 'block' }}>
              Không có người dùng nào trong trang này.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
