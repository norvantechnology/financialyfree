-- PostgreSQL initialization
-- Extensions are installed here; TimescaleDB is handled by its own init.
-- The actual schema is managed by TypeORM migrations.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "timescaledb" CASCADE;

-- Set timezone
SET timezone = 'Asia/Kolkata';
