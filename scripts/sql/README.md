# SQL Script Staging Area

This folder is for non-migration SQL scripts used during local investigation or controlled maintenance.

- `debug/`: short-lived investigation queries.
- `fixes/`: one-off remediation scripts.
- `checks/`: read-only validation queries.
- `oneoff/`: temporary scripts that do not belong in migrations.

Rules:
- Canonical schema changes must go in `supabase/migrations/`.
- Keep scripts idempotent where possible.
- Remove stale scripts after the related issue is resolved.
