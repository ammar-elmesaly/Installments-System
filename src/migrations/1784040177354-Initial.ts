import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1784040177354 implements MigrationInterface {
    name = 'Initial1784040177354'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_05c72498dcbaf160f3db1373756"`);
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "installmentPlanId" TO "installment_plan_id"`);
        await queryRunner.query(`ALTER TABLE "people" ADD "nick_name" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb" FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_cc5852e3e8c6d9b6837d0be6adb"`);
        await queryRunner.query(`ALTER TABLE "people" DROP COLUMN "nick_name"`);
        await queryRunner.query(`ALTER TABLE "transactions" RENAME COLUMN "installment_plan_id" TO "installmentPlanId"`);
        await queryRunner.query(`ALTER TABLE "transactions" ADD CONSTRAINT "FK_05c72498dcbaf160f3db1373756" FOREIGN KEY ("installmentPlanId") REFERENCES "installment_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
