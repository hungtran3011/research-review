import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Field,
  Input,
  Spinner,
  Switch,
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
import type { TrackDto, TrackRequestDto } from '../../models';
import { useTracks, useCreateTrack, useUpdateTrack, useDeleteTrack } from '../../hooks/useInstitutionTrack';

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
    gridTemplateColumns: '2fr 3fr 1fr auto',
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

type TrackDraft = {
  name: string;
  description: string;
  isActive: boolean;
};

const TrackManagement = () => {
  const classes = useStyles();
  const { data, isLoading } = useTracks();
  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();
  const deleteTrack = useDeleteTrack();

  const tracks = useMemo(() => data?.data ?? [], [data]);

  const [createForm, setCreateForm] = useState<TrackDraft>({
    name: '',
    description: '',
    isActive: true,
  });

  const [draftById, setDraftById] = useState<Record<string, TrackDraft>>({});

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
          };
        }
      }
      return next;
    });
  }, [tracks]);

  const isMutating = createTrack.isPending || updateTrack.isPending || deleteTrack.isPending;

  const handleCreate = () => {
    const payload: TrackRequestDto = {
      name: createForm.name.trim(),
      description: createForm.description.trim(),
      isActive: createForm.isActive,
    };
    if (!payload.name) return;
    createTrack.mutate(payload, {
      onSuccess: () => {
        setCreateForm({ name: '', description: '', isActive: true });
      },
    });
  };

  const updateDraft = (id: string, patch: Partial<TrackDraft>) => {
    setDraftById((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? { name: '', description: '', isActive: true }),
        ...patch,
      },
    }));
  };

  const handleSave = (track: TrackDto) => {
    const draft = draftById[track.id];
    if (!draft) return;

    updateTrack.mutate({
      id: track.id,
      data: {
        name: draft.name.trim(),
        description: draft.description.trim(),
        isActive: draft.isActive,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTrack.mutate(id);
  };

  return (
    <div className={classes.container}>
      <div className={classes.header}>
        <Text size={600} weight="semibold">
          Quản lý Track
        </Text>
      </div>

      <div className={classes.formRow}>
        <Field label="Tên track" required>
          <Input
            value={createForm.name}
            onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
            placeholder="VD: Computer Science"
          />
        </Field>
        <Field label="Mô tả">
          <Input
            value={createForm.description}
            onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="Mô tả ngắn"
          />
        </Field>
        <Field label="Kích hoạt">
          <Switch
            checked={createForm.isActive}
            onChange={(_e, d) => setCreateForm((p) => ({ ...p, isActive: d.checked }))}
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
        <Spinner label="Đang tải danh sách track..." />
      ) : (
        <div className={classes.tableWrapper}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Tên</TableHeaderCell>
                <TableHeaderCell>Mô tả</TableHeaderCell>
                <TableHeaderCell>Kích hoạt</TableHeaderCell>
                <TableHeaderCell>Hành động</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tracks.map((track) => {
                const draft = draftById[track.id] ?? {
                  name: track.name ?? '',
                  description: track.description ?? '',
                  isActive: Boolean(track.isActive),
                };

                return (
                  <TableRow key={track.id}>
                    <TableCell>
                      <Input
                        value={draft.name}
                        onChange={(e) => updateDraft(track.id, { name: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={draft.description}
                        onChange={(e) => updateDraft(track.id, { description: e.target.value })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={draft.isActive}
                        onChange={(_e, d) => updateDraft(track.id, { isActive: d.checked })}
                        disabled={isMutating}
                      />
                    </TableCell>
                    <TableCell>
                      <div className={classes.actions}>
                        <Button
                          appearance="primary"
                          icon={<Save16Regular />}
                          onClick={() => handleSave(track)}
                          disabled={isMutating || !draft.name.trim()}
                        >
                          Lưu
                        </Button>
                        <Button
                          appearance="secondary"
                          icon={<Delete16Regular />}
                          onClick={() => handleDelete(track.id)}
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

          {tracks.length === 0 && (
            <Text style={{ padding: '16px', display: 'block' }}>
              Chưa có track nào.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default TrackManagement;
