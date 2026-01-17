# Fix: `article_status_check` constraint blocks editor decision

## Symptom

When editor requests approval/rejection (status transitions to `ACCEPT_REQUESTED`/`REJECT_REQUESTED`), Postgres rejects the update:

- `ERROR: new row for relation "article" violates check constraint "article_status_check"`

## Root cause

Database constraint was created for the older status range (`0..5`), but the backend `ArticleStatus` enum currently includes values up to `8`.

- DB constraint (old): `CHECK (status >= 0 AND status <= 5)`
- Backend enum includes: `ACCEPTED(6)`, `REJECT_REQUESTED(7)`, `ACCEPT_REQUESTED(8)`

## Fix (SQL)

Run against the `research` database:

```sql
ALTER TABLE article DROP CONSTRAINT IF EXISTS article_status_check;
ALTER TABLE article ADD CONSTRAINT article_status_check
  CHECK ((status >= 0) AND (status <= 8));
```

## Verify

```sql
SELECT conname, pg_get_constraintdef(c.oid) AS def
FROM pg_constraint c
WHERE c.conrelid = 'article'::regclass
  AND conname = 'article_status_check';
```
