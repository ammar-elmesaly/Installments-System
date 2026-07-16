import { MigrationInterface, QueryRunner } from "typeorm";

export class InstallmentPlan1784214047886 implements MigrationInterface {
    name = 'InstallmentPlan1784214047886'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD "monthly_amount" numeric(12,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD "start_date" date NOT NULL`);
        await queryRunner.query(`ALTER TABLE "installment_plans" ADD "notes" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP COLUMN "notes"`);
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP COLUMN "start_date"`);
        await queryRunner.query(`ALTER TABLE "installment_plans" DROP COLUMN "monthly_amount"`);
    }

}
