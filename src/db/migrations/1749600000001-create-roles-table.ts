import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRolesTable1749600000001 implements MigrationInterface {
  name = 'CreateRolesTable1749600000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "name"        VARCHAR(255)  UNIQUE NOT NULL,
        "key"         VARCHAR(255)  UNIQUE NOT NULL,
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
      INSERT INTO "roles" ("name", "key", "description") VALUES
        ('User',  'user',  'Regular user'),
        ('Admin', 'admin', 'Administrator')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "roles"`);
  }
}
