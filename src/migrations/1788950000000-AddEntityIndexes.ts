import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEntityIndexes1788950000000 implements MigrationInterface {
  name = 'AddEntityIndexes1788950000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953"`);
    await queryRunner.query(`ALTER TABLE "activity_logs" RENAME COLUMN "adminId" TO "admin_id"`);
    await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

    await queryRunner.query(`CREATE INDEX "IDX_accounts_person_id" ON "accounts" ("person_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_admins_person_id" ON "admins" ("person_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_clients_person_id" ON "clients" ("person_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_installment_plans_client_id" ON "installment_plans" ("client_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_installment_plans_status_id" ON "installment_plans" ("status", "id")`);
    await queryRunner.query(`CREATE INDEX "IDX_installment_months_plan_due" ON "installment_months" ("installment_plan_id", "due_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_installment_months_status_due" ON "installment_months" ("status", "due_date")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_admin_id" ON "transactions" ("admin_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_plan_created" ON "transactions" ("installment_plan_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_month_id" ON "transactions" ("installment_month_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_transactions_created_at" ON "transactions" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_admin_created" ON "activity_logs" ("admin_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_target_created" ON "activity_logs" ("target_id", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_action_created" ON "activity_logs" ("action", "created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_activity_logs_created_at" ON "activity_logs" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_activity_logs_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_activity_logs_action_created"`);
    await queryRunner.query(`DROP INDEX "IDX_activity_logs_target_created"`);
    await queryRunner.query(`DROP INDEX "IDX_activity_logs_admin_created"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_created_at"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_month_id"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_plan_created"`);
    await queryRunner.query(`DROP INDEX "IDX_transactions_admin_id"`);
    await queryRunner.query(`DROP INDEX "IDX_installment_months_status_due"`);
    await queryRunner.query(`DROP INDEX "IDX_installment_months_plan_due"`);
    await queryRunner.query(`DROP INDEX "IDX_installment_plans_status_id"`);
    await queryRunner.query(`DROP INDEX "IDX_installment_plans_client_id"`);
    await queryRunner.query(`DROP INDEX "IDX_clients_person_id"`);
    await queryRunner.query(`DROP INDEX "IDX_admins_person_id"`);
    await queryRunner.query(`DROP INDEX "IDX_accounts_person_id"`);

    await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953"`);
    await queryRunner.query(`ALTER TABLE "activity_logs" RENAME COLUMN "admin_id" TO "adminId"`);
    await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
  }
}