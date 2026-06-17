import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolePermissionsTable1749600000003 implements MigrationInterface {
  name = 'CreateRolePermissionsTable1749600000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "id"            BIGSERIAL   PRIMARY KEY,
        "role_id"       BIGINT      NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" BIGINT      NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        "created_at"    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("role_id", "permission_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_permissions"`);
  }
}

