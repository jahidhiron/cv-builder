import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserProfilesTable1749600000008 implements MigrationInterface {
  name = 'CreateUserProfilesTable1749600000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id"                   BIGSERIAL  PRIMARY KEY,
        "user_id"              BIGINT     NOT NULL UNIQUE,
        "category_id"          BIGINT,
        "years_of_experience"  SMALLINT,
        "data"                 JSONB      NOT NULL DEFAULT '{}',
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_user_profiles_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_profiles_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_user_profiles_user_id"     ON "user_profiles"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_user_profiles_category_id" ON "user_profiles"("category_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "user_profiles"`);
  }
}

