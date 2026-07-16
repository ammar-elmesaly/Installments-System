import { MigrationInterface, QueryRunner } from "typeorm";

export class AllowClientRemoval1784239272259 implements MigrationInterface {
    name = 'AllowClientRemoval1784239272259'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_23a8893beee4bd4bdcfc55f3376"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb"`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_plan_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_month_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD "notes" character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "fallback_contacts" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "fallback_contacts" ADD "notes" character varying(1000)`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_plan_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_month_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb" FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_23a8893beee4bd4bdcfc55f3376" FOREIGN KEY ("installment_month_id") REFERENCES "installment_months"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_23a8893beee4bd4bdcfc55f3376"`);
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb"`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_month_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_plan_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "fallback_contacts" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "fallback_contacts" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD "notes" character varying`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_month_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ALTER COLUMN "installment_plan_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb" FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_23a8893beee4bd4bdcfc55f3376" FOREIGN KEY ("installment_month_id") REFERENCES "installment_months"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
