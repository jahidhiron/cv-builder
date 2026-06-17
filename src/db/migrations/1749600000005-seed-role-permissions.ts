import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedRolePermissions1749600000005 implements MigrationInterface {
  name = 'SeedRolePermissions1749600000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.key = 'admin'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions" rp
      USING "roles" r
      WHERE rp.role_id = r.id AND r.key = 'admin'
    `);
  }
}

