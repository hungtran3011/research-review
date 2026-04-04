import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Spin, Table, Typography, Space, Form } from 'antd';
import { DeleteOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import type { InstitutionDto } from '../../models';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('common');
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
      title: t('institutionManagement.columns.name'),
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
      title: t('institutionManagement.columns.country'),
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
      title: t('institutionManagement.columns.website'),
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
      title: t('institutionManagement.columns.logo'),
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
      title: t('institutionManagement.columns.actions'),
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
              {t('institutionManagement.actions.save')}
            </Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
              disabled={isMutating}
            >
              {t('institutionManagement.actions.delete')}
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={styles.container}>
      <Text strong style={{ fontSize: '24px', marginBottom: '8px' }}>
        {t('institutionManagement.title')}
      </Text>

      <div style={styles.formRow}>
        <Form.Item label={t('institutionManagement.form.nameLabel')} required>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder={t('institutionManagement.form.namePlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('institutionManagement.form.countryLabel')}>
          <Input
            value={createForm.country}
            onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
            placeholder={t('institutionManagement.form.countryPlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('institutionManagement.form.websiteLabel')}>
          <Input
            value={createForm.website}
            onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
            placeholder={t('institutionManagement.form.websitePlaceholder')}
          />
        </Form.Item>
        <Form.Item label={t('institutionManagement.form.logoLabel')}>
          <Input
            value={createForm.logo}
            onChange={(e) => setCreateForm((p) => ({ ...p, logo: e.target.value }))}
            placeholder={t('institutionManagement.form.logoPlaceholder')}
          />
        </Form.Item>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          disabled={isMutating || !createForm.name.trim()}
          onClick={handleCreate}
        >
          {t('institutionManagement.actions.create')}
        </Button>
      </div>

      {isLoading ? (
        <Spin size="large" tip={t('institutionManagement.loading')} />
      ) : (
        <Table
          columns={columns}
          dataSource={institutions}
          rowKey="id"
          locale={{
            emptyText: t('institutionManagement.empty'),
          }}
          pagination={false}
        />
      )}
    </div>
  );
};

export default InstitutionManagement;
