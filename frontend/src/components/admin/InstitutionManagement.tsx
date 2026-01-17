import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Delete16Regular, Save16Regular, Add16Regular } from '@fluentui/react-icons';
import type { InstitutionDto } from '../../models';
import {
  useInstitutions,
  useCreateInstitution,
  useUpdateInstitution,
  useDeleteInstitution,
} from '../../hooks/useInstitutionTrack';

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
  formRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 2fr 2fr 2fr auto',
    gap: '12px',
    alignItems: 'end',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },
});

type InstitutionDraft = {
  name: string;
  country: string;
  website: string;
  logo: string;
};

const InstitutionManagement = () => {
  const classes = useStyles();
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

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size={600} weight="semibold">
          Quản lý Nơi công tác
        </Text>
      </div>

      <div className={classes.formRow}>
        <Field label="Tên" required>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="VD: Trường Đại học ABC"
          />
        </Field>
        <Field label="Quốc gia">
          <Input
            value={createForm.country}
            onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))}
            placeholder="VD: Vietnam"
          />
        </Field>
        <Field label="Website">
          <Input
            value={createForm.website}
            onChange={(e) => setCreateForm((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://example.edu"
          />
        </Field>
        <Field label="Logo">
          <Input
            value={createForm.logo}
            onChange={(e) => setCreateForm((p) => ({ ...p, logo: e.target.value }))}
            placeholder="https://.../logo.png"
          />
        </Field>
        <Button
          appearance="primary"
          icon={<Add16Regular />}
          disabled={isMutating || !createForm.name.trim()}
          onClick={handleCreate}
        >
          Tạo
        </Button>
      </div>

      {isLoading ? (
        <Spinner label="Đang tải danh sách nơi công tác..." />
      ) : (
        <div className={classes.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tên</TableHeaderCell>
                <TableHeaderCell>Quốc gia</TableHeaderCell>
                <TableHeaderCell>Website</TableHeaderCell>
                <TableHeaderCell>Logo</TableHeaderCell>
                <TableHeaderCell>Hành động</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {institutions.map((ins) => {
                const draft = draftById[ins.id] ?? {
                  name: ins.name ?? '',
                  country: ins.country ?? '',
                  website: ins.website ?? '',
                  logo: ins.logo ?? '',
                };

                return (
                  <TableRow key={ins.id}>
                    <TableCell>
                      <Input
                        value={draft.name}
                        onChange={(e) => updateDraft(ins.id, { name: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.country}
                        onChange={(e) => updateDraft(ins.id, { country: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.website}
                        onChange={(e) => updateDraft(ins.id, { website: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.logo}
                        onChange={(e) => updateDraft(ins.id, { logo: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={classes.actions}>
                        <Button
                          appearance="primary"
                          icon={<Save16Regular />}
                          onClick={() => handleSave(ins.id)}
                          disabled={isMutating || !draft.name.trim()}
                        >
                          Lưu
                        </Button>
                        <Button
                          appearance="secondary"
                          icon={<Delete16Regular />}
                          onClick={() => handleDelete(ins.id)}
                          disabled={isMutating}
                        >
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {institutions.length === 0 && (
            <Text style={{ padding: '16px', display: 'block' }}>
              Chưa có nơi công tác nào.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default InstitutionManagement;
