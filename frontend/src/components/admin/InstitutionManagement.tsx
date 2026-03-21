import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Spin, Table, Typography, Space, Form } from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import type { InstitutionDto } from '../../models';
import {
  useInstitutions,
  useCreateInstitution,
  useUpdateInstitution,
  useDeleteInstitution,
} from '../../hooks/useInstitutionTrack';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

const styles = {
  container: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 2fr 2fr auto',
    gap: '12px',
    alignItems: 'end',
  },
} as const;

type InstitutionDraft = {
  name: string;
  country: string;
  website: string;
  logo: string;
};

const InstitutionManagement = () => {
  const { data, isLoading } = useInstitutions(0, 100);
  const createInstitution = useCreateInstitution();
  const updateInstitution = useUpdateInstitution();
  const deleteInstitution = useDeleteInstitution();

  const institutions = useMemo(() => data?.data?.content ?? [], [data]);

  const [createForm, setCreateForm] = useState<InstitutionDraft>({
    name: '',
    country: '',
    website: '',
    logo: '',
  });

  const [draftById, setDraftById] = useState<Record<string, InstitutionDraft>>({});

  useEffect(() => {
    if (institutions.length === 0) return;
    setDraftById((prev) => {
      const next = { ...prev };
      for (const i of institutions) {
        if (!next[i.id]) {
          next[i.id] = {
            name: i.name ?? '',
            country: i.country ?? '',
            website: i.website ?? '',
            logo: i.logo ?? '',
          };
        }
      }
      return next;
    });
  }, [institutions]);

  const isMutating =
    createInstitution.isPending || updateInstitution.isPending || deleteInstitution.isPending;

  const handleCreate = () => {
    if (!createForm.name.trim()) return;

    const payload: InstitutionDto = {
      id: '',
      name: createForm.name.trim(),
      country: createForm.country.trim(),
      website: createForm.website.trim(),
      logo: createForm.logo.trim(),
    };

    createInstitution.mutate(payload, {
      onSuccess: () => {
        setCreateForm({ name: '', country: '', website: '', logo: '' });
      },
    });
  };

  const updateDraft = (id: string, patch: Partial<InstitutionDraft>) => {
    setDraftById((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { name: '', country: '', website: '', logo: '' }),
        ...patch,
      },
    }));
  };

  const handleSave = (id: string) => {
    const draft = draftById[id];
    if (!draft || !draft.name.trim()) return;

    updateInstitution.mutate({
      id,
      data: {
        id,
        name: draft.name.trim(),
        country: draft.country.trim(),
        website: draft.website.trim(),
        logo: draft.logo.trim(),
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteInstitution.mutate(id);
  };

  const columns: ColumnsType<InstitutionDto & { draft?: InstitutionDraft }> = [
    {
      title: 'Tên',
      key: 'name',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.name ?? record.name ?? ''}
          onChange={(e) => updateDraft(record.id, { name: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Quốc gia',
      key: 'country',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.country ?? record.country ?? ''}
          onChange={(e) => updateDraft(record.id, { country: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Website',
      key: 'website',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.website ?? record.website ?? ''}
          onChange={(e) => updateDraft(record.id, { website: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Logo',
      key: 'logo',
      render: (_, record) => (
        <Input
          value={draftById[record.id]?.logo ?? record.logo ?? ''}
          onChange={(e) => updateDraft(record.id, { logo: e.target.value })}
          disabled={isMutating}
        />
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => {
        const draft = draftById[record.id];
        return (
          <Space>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => handleSave(record.id)}
              disabled={isMutating || !draft?.name.trim()}
            >
              Lưu
            </Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={isMutating}
            >
              Xóa
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={styles.container}>
      <Text strong style={{ fontSize: '24px', marginBottom: '8px' }}>
        Quản lý Nơi công tác
      </Text>

      <div style={styles.formRow}>
        <Form.Item label="Tên" required>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="VD: Trường Đại học ABC"
          />
        </Form.Item>
        <Form.Item label="Quốc gia">
          <Input
            value={createForm.country}
            onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
            placeholder="VD: Vietnam"
          />
        </Form.Item>
        <Form.Item label="Website">
          <Input
            value={createForm.website}
            onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://example.edu"
          />
        </Form.Item>
        <Form.Item label="Logo">
          <Input
            value={createForm.logo}
            onChange={(e) => setCreateForm((p) => ({ ...p, logo: e.target.value }))}
            placeholder="https://.../logo.png"
          />
        </Form.Item>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={isMutating || !createForm.name.trim()}
          onClick={handleCreate}
        >
          Tạo
        </Button>
      </div>

      {isLoading ? (
        <Spin size="large" tip="Đang tải danh sách nơi công tác..." />
      ) : (
        <Table
          columns={columns}
          dataSource={institutions}
          rowKey="id"
          locale={{
            emptyText: 'Chưa có nơi công tác nào.',
          }}
          pagination={false}
        />
      )}
    </div>
  );
};

export default InstitutionManagement;
