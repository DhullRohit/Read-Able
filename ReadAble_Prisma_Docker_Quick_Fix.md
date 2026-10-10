# ReadAble: Prisma + Docker Missing Column Fix

## Error

``` text
Prisma error P2022: The column `User.phone` does not exist in the current database.
```

**Cause:** `schema.prisma` expected `phone`, but PostgreSQL inside
Docker did not have that column. `prisma migrate status` can say "up to
date" even when the live schema has drifted from the Prisma schema.

## 1. Check Docker and the database

Run from the backend directory in PowerShell:

``` powershell
docker ps
docker exec -it readable-postgres psql -U readable -d readable_db
```

Inside PostgreSQL, inspect the `User` columns:

``` sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'User'
ORDER BY ordinal_position;
```

Exit with `\q`.

## 2. Repair a missing column

Only if the query confirms that `phone` is missing, reconnect and run:

``` sql
ALTER TABLE public."User" ADD COLUMN "phone" TEXT;
```

Check indexes first:

``` sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'User';
```

If a unique index for `"phone"` is not already present, create it:

``` sql
CREATE UNIQUE INDEX "User_phone_key" ON public."User"("phone");
```

This matches `phone String? @unique`. Do not delete existing data. If
index creation fails due to duplicate non-null phone values, investigate
duplicates before proceeding.

Then, from `backend/`:

``` powershell
npx prisma generate
npm run dev
```

Test login and the relevant API endpoint.

## 3. Prevent it from happening again

Whenever you change `backend/prisma/schema.prisma`, create and commit a
migration:

``` powershell
# From backend/
npx prisma migrate dev --name descriptive_change
npx prisma generate
npx prisma migrate status
```

Commit both `prisma/schema.prisma` and the new `prisma/migrations/`
folder to Git. Teammates should pull the changes and run
`npx prisma migrate dev`. Deployment environments should use
`npx prisma migrate deploy`.

Because `phone` was added manually in this incident, ensure migration
history is reconciled: inspect the existing migration SQL and verify a
committed migration can create the column and unique index on a fresh
database. If Prisma reports no changes or migration drift, stop and
inspect before making further changes---do not reset the database or
delete migrations to force it.

## 4. Connection and safety notes

Backend runs on Windows, PostgreSQL runs in Docker, so the expected host
URL is:

``` env
DATABASE_URL="postgresql://readable:ACTUAL_PASSWORD@localhost:5433/readable_db"
```

Replace `ACTUAL_PASSWORD` with the real password. If the backend later
runs inside Docker Compose, its hostname/port will normally be the
PostgreSQL service name and `5432`.

**Never run `prisma migrate reset`, delete the PostgreSQL volume, or
remove migrations to fix a missing column in a database containing data
you need.** Docker volumes preserve data; they do not apply Prisma
schema changes.

## Quick checklist

-   [ ] Correct Docker container and database confirmed
-   [ ] `User.phone` column exists
-   [ ] Unique phone index exists
-   [ ] `npx prisma generate` succeeds
-   [ ] Login/API works
-   [ ] Migration history can reproduce the schema from scratch
-   [ ] Schema and migration committed together

**Rule:** Editing `schema.prisma` alone does not update PostgreSQL. Use
migrations for every schema change.
