import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequireTicketAsset1787875200000 implements MigrationInterface {
  name = 'RequireTicketAsset1787875200000';
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM "tickets" WHERE "asset_id" IS NULL) THEN RAISE EXCEPTION 'Cannot require asset_id while legacy tickets exist'; END IF; END $$;`);
    await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "asset_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "location"`);
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "asset"`);
  }
  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tickets" ADD "asset" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "tickets" ADD "location" character varying(200)`);
    await queryRunner.query(`ALTER TABLE "tickets" ALTER COLUMN "asset_id" DROP NOT NULL`);
  }
}
