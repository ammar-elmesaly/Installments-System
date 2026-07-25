import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeAdminPermissions1784495604516 implements MigrationInterface {
    name = 'ChangeAdminPermissions1784495604516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."admins_admin_level_enum" RENAME TO "admins_admin_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."admins_admin_level_enum" AS ENUM('2', '1', '0')`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" TYPE "public"."admins_admin_level_enum" USING "admin_level"::"text"::"public"."admins_admin_level_enum"`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."admins_admin_level_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."admins_admin_level_enum" RENAME TO "admins_admin_level_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."admins_admin_level_enum" AS ENUM('2', '1', '0')`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" TYPE "public"."admins_admin_level_enum" USING "admin_level"::"text"::"public"."admins_admin_level_enum"`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."admins_admin_level_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."admins_admin_level_enum_old" AS ENUM('3', '2', '1', '0')`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" TYPE "public"."admins_admin_level_enum_old" USING "admin_level"::"text"::"public"."admins_admin_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."admins_admin_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."admins_admin_level_enum_old" RENAME TO "admins_admin_level_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."admins_admin_level_enum_old" AS ENUM('3', '2', '1', '0')`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" TYPE "public"."admins_admin_level_enum_old" USING "admin_level"::"text"::"public"."admins_admin_level_enum_old"`);
        await queryRunner.query(`ALTER TABLE "admins" ALTER COLUMN "admin_level" SET DEFAULT '0'`);
        await queryRunner.query(`DROP TYPE "public"."admins_admin_level_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."admins_admin_level_enum_old" RENAME TO "admins_admin_level_enum"`);
    }

}
