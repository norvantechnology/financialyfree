import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration 002: Users, sessions, and refresh tokens (Sprint 1 — Auth)
 */
export class UsersAuth1725000000002 implements MigrationInterface {
  name = 'UsersAuth1725000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Users ──────────────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE user_role AS ENUM ('user', 'admin', 'distributor');

      CREATE TABLE users (
        id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email           VARCHAR(255) NOT NULL UNIQUE,
        password_hash   VARCHAR(255),
        first_name      VARCHAR(100) NOT NULL,
        last_name       VARCHAR(100) NOT NULL,
        phone           VARCHAR(15),
        role            user_role NOT NULL DEFAULT 'user',
        avatar_url      TEXT,
        preferred_language VARCHAR(5) NOT NULL DEFAULT 'en',
        is_email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
        is_phone_verified  BOOLEAN NOT NULL DEFAULT FALSE,
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        google_id       VARCHAR(255),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
    `);

    // ── User Sessions ─────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE user_sessions (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        device_info   TEXT,
        ip_address    INET,
        user_agent    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at    TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);
    `);

    // ── Refresh Tokens ────────────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        session_id  UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL UNIQUE,
        is_revoked  BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at  TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
      CREATE INDEX idx_refresh_tokens_session ON refresh_tokens(session_id);
    `);

    // ── Password Reset Tokens ─────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  VARCHAR(255) NOT NULL UNIQUE,
        is_used     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at  TIMESTAMPTZ NOT NULL
      );

      CREATE INDEX idx_prt_token ON password_reset_tokens(token_hash);
    `);

    // ── User Consent (DPDP readiness) ─────────────────────────────────
    await queryRunner.query(`
      CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'whatsapp', 'sms', 'push');

      CREATE TABLE user_consents (
        id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        channel       notification_channel NOT NULL,
        has_consented BOOLEAN NOT NULL DEFAULT FALSE,
        consented_at  TIMESTAMPTZ,
        revoked_at    TIMESTAMPTZ,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, channel)
      );
    `);

    // ── Audit Log (security) ──────────────────────────────────────────
    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
        action      VARCHAR(100) NOT NULL,
        resource    VARCHAR(100),
        resource_id UUID,
        ip_address  INET,
        user_agent  TEXT,
        metadata    JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_audit_user ON audit_logs(user_id, created_at DESC);
      CREATE INDEX idx_audit_action ON audit_logs(action, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_consents`);
    await queryRunner.query(`DROP TABLE IF EXISTS password_reset_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_sessions`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_channel`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
