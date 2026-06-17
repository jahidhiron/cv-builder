import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePermissionsTable1749600000002 implements MigrationInterface {
  name = 'CreatePermissionsTable1749600000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}

