import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the RBAC (Role-Based Access Control) schema and seeds reference data.
 *
 * Tables created:
 *  - `roles`            — named roles (User, Admin) with soft-delete support
 *  - `permissions`      — granular permission keys (e.g. `users:read`)
 *  - `role_permissions` — many-to-many join between roles and permissions
 *
 * Seed data:
 *  - Roles:       User, Admin
 *  - Permissions: roles:create/read/update/delete/restore, users:create/read/update/delete/restore
 *  - Grants:      all permissions assigned to the Admin role
 */
export class CreateRbacSchema1749600000001 implements MigrationInterface {
  name = 'CreateRbacSchema1749600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Roles
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "name"        VARCHAR(255)  NOT NULL,
        "description" TEXT,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "is_deleted"  BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"  TIMESTAMPTZ,
        "deleted_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_roles_name_lower" ON "roles" (LOWER("name"))
    `);

    await queryRunner.query(`
      INSERT INTO "roles" ("name", "description") VALUES
        ('User',  'Regular user'),
        ('Admin', 'Administrator')
    `);

    // Permissions
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "name"        VARCHAR(100)  UNIQUE NOT NULL,
        "key"         VARCHAR(100)  UNIQUE NOT NULL,
        "description" TEXT,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "key", "description") VALUES
        ('Create Role',  'roles:create',  'Create a new role'),
        ('Read Roles',   'roles:read',    'View roles list and details'),
        ('Update Role',  'roles:update',  'Update an existing role'),
        ('Delete Role',  'roles:delete',  'Soft or hard delete a role'),
        ('Restore Role', 'roles:restore', 'Restore a soft-deleted role'),
        ('Manage Permissions', 'roles:manage-permissions', 'Manage system permissions'),
        ('Create User',  'users:create',  'Create a new user'),
        ('Read Users',   'users:read',    'View users list and details'),
        ('Update User',  'users:update',  'Update an existing user'),
        ('Delete User',  'users:delete',  'Soft or hard delete a user'),
        ('Restore User', 'users:restore', 'Restore a soft-deleted user')
    `);

    // Role-permissions join
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id"            BIGSERIAL   PRIMARY KEY,
        "role_id"       BIGINT      NOT NULL REFERENCES "roles"("id")       ON DELETE CASCADE,
        "permission_id" BIGINT      NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("role_id", "permission_id")
      )
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE LOWER(r.name) = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
