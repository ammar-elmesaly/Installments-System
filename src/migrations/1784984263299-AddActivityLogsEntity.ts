import { MigrationInterface, QueryRunner } from "typeorm";

export class AddActivityLogsEntity1784984263299 implements MigrationInterface {
    name = 'AddActivityLogEntity1784984263299'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."activity_logs_action_enum" AS ENUM('CLIENT_CREATED', 'CLIENT_UPDATED', 'CLIENT_DELETED', 'PLAN_CREATED', 'PLAN_FROZEN', 'PLAN_UNFROZEN', 'PLAN_NOTES_UPDATED', 'PAYMENT_RECORDED', 'PAYMENT_REVERSED', 'ADMIN_LEVEL_CHANGED')`);
        await queryRunner.query(`CREATE TABLE "activity_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" "public"."activity_logs_action_enum" NOT NULL, "target_id" uuid, "target_label" character varying, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "adminId" uuid, CONSTRAINT "PK_f25287b6140c5ba18d38776a796" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_1ce658094e7e55ec35c1a12d953"`);
        await queryRunner.query(`DROP TABLE "activity_logs"`);
        await queryRunner.query(`DROP TYPE "public"."activity_logs_action_enum"`);
    }

}
