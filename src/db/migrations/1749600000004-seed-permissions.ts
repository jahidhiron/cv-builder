import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedPermissions1749600000004 implements MigrationInterface {
  name = 'SeedPermissions1749600000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("name", "key", "description") VALUES
        ('Create Role',  'roles:create',  'Create a new role'),
        ('Read Roles',   'roles:read',    'View roles list and details'),
        ('Update Role',  'roles:update',  'Update an existing role'),
        ('Delete Role',  'roles:delete',  'Soft or hard delete a role'),
        ('Restore Role', 'roles:restore', 'Restore a soft-deleted role')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "permissions" WHERE "key" LIKE 'roles:%'`);
  }
}

