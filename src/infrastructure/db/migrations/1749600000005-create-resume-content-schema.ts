import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the resume content schema — all tables required to build and store resumes.
 *
 * Tables created:
 *  - `categories`               — job/industry categories for profiles and templates
 *  - `resume_styles`            — visual style definitions (colours, fonts, layout variants)
 *  - `section_types`            — system-defined section types (Summary, Experience, …) with seed rows
 *  - `profile_field_definitions`— per-category custom profile fields
 *  - `user_profiles`            — one-to-one user profile with JSONB data bag
 *  - `templates`                — resume templates linking a style and a category
 *  - `resumes`                  — user resume documents
 *  - `resume_sections`          — ordered sections within a resume, typed by `section_types`
 *
 * Seed data:
 *  - Section types: Summary, Experience, Education, Skills, Projects, Certifications, Custom
 */
export class CreateResumeContentSchema1749600000005 implements MigrationInterface {
  name = 'CreateResumeContentSchema1749600000005';

  /**
   * Applies the migration: creates all resume content tables and seeds initial section types.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Categories
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id"         BIGSERIAL     PRIMARY KEY,
        "name"       VARCHAR(255)  NOT NULL,
        "slug"       VARCHAR(255)  UNIQUE NOT NULL,
        "sort_order" SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted" BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at" TIMESTAMPTZ,
        "created_by" BIGINT,
        "updated_by" BIGINT,
        "created_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_categories_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_categories_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_categories_slug" ON "categories"("slug")`);

    // Resume styles
    await queryRunner.query(`
      CREATE TABLE "resume_styles" (
        "id"            BIGSERIAL     PRIMARY KEY,
        "name"          VARCHAR(255)  NOT NULL,
        "slug"          VARCHAR(255)  UNIQUE NOT NULL,
        "thumbnail_url" TEXT,
        "sort_order"    SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"    TIMESTAMPTZ,
        "created_by"    BIGINT,
        "updated_by"    BIGINT,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_styles_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_resume_styles_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    // Section types
    await queryRunner.query(`
      CREATE TABLE "section_types" (
        "id"           BIGSERIAL     PRIMARY KEY,
        "name"         VARCHAR(255)  NOT NULL,
        "slug"         VARCHAR(255)  UNIQUE NOT NULL,
        "icon"         VARCHAR(255),
        "field_schema" JSONB,
        "is_system"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "sort_order"   SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"   BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"   TIMESTAMPTZ,
        "created_by"   BIGINT,
        "updated_by"   BIGINT,
        "created_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"   TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_section_types_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_section_types_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      INSERT INTO "section_types" ("name", "slug", "is_system", "sort_order") VALUES
        ('Summary',        'summary',        TRUE, 1),
        ('Experience',     'experience',     TRUE, 2),
        ('Education',      'education',      TRUE, 3),
        ('Skills',         'skills',         TRUE, 4),
        ('Projects',       'projects',       TRUE, 5),
        ('Certifications', 'certifications', TRUE, 6),
        ('Custom',         'custom',         FALSE, 7)
    `);

    // Profile field definitions
    await queryRunner.query(`
      CREATE TABLE "profile_field_definitions" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "category_id" BIGINT,
        "field_key"   VARCHAR(255)  NOT NULL,
        "field_label" VARCHAR(255)  NOT NULL,
        "field_type"  VARCHAR(50)   NOT NULL,
        "options"     JSONB,
        "is_required" BOOLEAN       NOT NULL DEFAULT FALSE,
        "order_index" SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"  BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"  TIMESTAMPTZ,
        "created_by"  BIGINT,
        "updated_by"  BIGINT,
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_pfd_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_pfd_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_pfd_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "uq_pfd_category_field_key"
          UNIQUE ("category_id", "field_key")
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_pfd_category_id" ON "profile_field_definitions"("category_id")`,
    );

    // User profiles
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id"                  BIGSERIAL   PRIMARY KEY,
        "user_id"             BIGINT      NOT NULL UNIQUE,
        "category_id"         BIGINT,
        "years_of_experience" SMALLINT,
        "data"                JSONB       NOT NULL DEFAULT '{}',
        "created_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_user_profiles_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user_profiles_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_user_profiles_user_id"     ON "user_profiles"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_user_profiles_category_id" ON "user_profiles"("category_id")`,
    );

    // Templates
    await queryRunner.query(`
      CREATE TABLE "templates" (
        "id"            BIGSERIAL     PRIMARY KEY,
        "name"          VARCHAR(255)  NOT NULL,
        "slug"          VARCHAR(255)  UNIQUE NOT NULL,
        "style_id"      BIGINT,
        "layout"        VARCHAR(50)   NOT NULL DEFAULT 'single_column',
        "target_level"  VARCHAR(50)   NOT NULL DEFAULT 'mid',
        "category_id"   BIGINT,
        "preview_url"   TEXT,
        "thumbnail_url" TEXT,
        "sort_order"    SMALLINT      NOT NULL DEFAULT 0,
        "is_deleted"    BOOLEAN       NOT NULL DEFAULT FALSE,
        "deleted_at"    TIMESTAMPTZ,
        "created_by"    BIGINT,
        "updated_by"    BIGINT,
        "created_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_templates_style_id"
          FOREIGN KEY ("style_id") REFERENCES "resume_styles"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_category_id"
          FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_created_by"
          FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "fk_templates_updated_by"
          FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_templates_style_id"    ON "templates"("style_id")`);
    await queryRunner.query(
      `CREATE INDEX "idx_templates_category_id" ON "templates"("category_id")`,
    );

    // Resumes
    await queryRunner.query(`
      CREATE TABLE "resumes" (
        "id"          BIGSERIAL     PRIMARY KEY,
        "user_id"     BIGINT        NOT NULL,
        "template_id" BIGINT,
        "title"       VARCHAR(255)  NOT NULL,
        "status"      VARCHAR(50)   NOT NULL DEFAULT 'draft',
        "created_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resumes_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resumes_template_id"
          FOREIGN KEY ("template_id") REFERENCES "templates"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_resumes_user_id"     ON "resumes"("user_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resumes_template_id" ON "resumes"("template_id")`);
    await queryRunner.query(`CREATE INDEX "idx_resumes_status"      ON "resumes"("status")`);

    // Resume sections
    await queryRunner.query(`
      CREATE TABLE "resume_sections" (
        "id"              BIGSERIAL   PRIMARY KEY,
        "resume_id"       BIGINT      NOT NULL,
        "section_type_id" BIGINT      NOT NULL,
        "order_index"     SMALLINT    NOT NULL DEFAULT 0,
        "is_visible"      BOOLEAN     NOT NULL DEFAULT TRUE,
        "content"         JSONB       NOT NULL DEFAULT '{}',
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_resume_sections_resume_id"
          FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_resume_sections_section_type_id"
          FOREIGN KEY ("section_type_id") REFERENCES "section_types"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_resume_sections_resume_id"       ON "resume_sections"("resume_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_resume_sections_section_type_id" ON "resume_sections"("section_type_id")`,
    );
  }

  /**
   * Reverts the migration: drops all resume content tables in dependency order.
   *
   * @param queryRunner - TypeORM query runner used to execute SQL statements
   * @returns Promise that resolves when all statements have executed
   */
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "resume_sections"`);
    await queryRunner.query(`DROP TABLE "resumes"`);
    await queryRunner.query(`DROP TABLE "templates"`);
    await queryRunner.query(`DROP TABLE "user_profiles"`);
    await queryRunner.query(`DROP TABLE "profile_field_definitions"`);
    await queryRunner.query(`DROP TABLE "section_types"`);
    await queryRunner.query(`DROP TABLE "resume_styles"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
