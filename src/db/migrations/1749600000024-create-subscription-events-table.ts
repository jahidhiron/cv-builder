import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSubscriptionEventsTable1749600000024 implements MigrationInterface {
  name = 'CreateSubscriptionEventsTable1749600000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscription_events" (
        "id"              BIGSERIAL     PRIMARY KEY,
        "subscription_id" BIGINT        NOT NULL,
        "user_id"         BIGINT        NOT NULL,
        "event_type"      VARCHAR(100)  NOT NULL,
        "metadata"        JSONB,
        "created_at"      TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_sub_events_subscription_id"
          FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sub_events_user_id"
          FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_sub_events_subscription_id" ON "subscription_events"("subscription_id")`);
    await queryRunner.query(`CREATE INDEX "idx_sub_events_user_id"         ON "subscription_events"("user_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "subscription_events"`);
  }
}
