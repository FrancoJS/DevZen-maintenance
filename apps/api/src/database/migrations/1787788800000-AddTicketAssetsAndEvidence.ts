import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTicketAssetsAndEvidence1787788800000
  implements MigrationInterface
{
  name = 'AddTicketAssetsAndEvidence1787788800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "tickets") THEN
          RAISE EXCEPTION
            'Cannot apply ticket asset migration while tickets exist. Export or remove legacy tickets explicitly first.';
        END IF;
      END $$;
    `);

    await queryRunner.query(`CREATE SEQUENCE "ticket_code_sequence" START WITH 1`);
    await queryRunner.query(`CREATE TABLE "locations" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "code" character varying(64) NOT NULL,
      "name" character varying(200) NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_locations_id" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_locations_code" ON "locations" ("code")`,
    );

    await queryRunner.query(`CREATE TABLE "assets" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "asset_code" character varying(64) NOT NULL,
      "name" character varying(200) NOT NULL,
      "brand" character varying(120) NOT NULL,
      "model" character varying(120) NOT NULL,
      "serial_number" character varying(120) NOT NULL,
      "category" character varying(120) NOT NULL,
      "location_id" uuid NOT NULL,
      "active" boolean NOT NULL DEFAULT true,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_assets_id" PRIMARY KEY ("id"),
      CONSTRAINT "fk_assets_location" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_assets_asset_code" ON "assets" ("asset_code")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_assets_serial_number" ON "assets" ("serial_number")`,
    );

    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "ticket_code" character varying(32) NOT NULL DEFAULT ('TCK-' || nextval('ticket_code_sequence')::text)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tickets_ticket_code" ON "tickets" ("ticket_code")`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD "asset_id" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "fk_tickets_asset" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tickets_asset" ON "tickets" ("asset_id")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tickets_open_asset" ON "tickets" ("asset_id") WHERE "asset_id" IS NOT NULL AND "status" <> 'CLOSED'`,
    );

    await queryRunner.query(
      `CREATE TYPE "ticket_evidence_type" AS ENUM ('FINAL')`,
    );
    await queryRunner.query(`CREATE TABLE "ticket_evidences" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ticket_id" uuid NOT NULL,
      "technician_id" uuid NOT NULL,
      "assignment_id" uuid NOT NULL,
      "type" "ticket_evidence_type" NOT NULL,
      "public_id" character varying(255) NOT NULL,
      "mime_type" character varying(64) NOT NULL,
      "size" integer NOT NULL,
      "original_filename" character varying(255) NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ticket_evidences_id" PRIMARY KEY ("id"),
      CONSTRAINT "chk_ticket_evidences_size" CHECK ("size" > 0),
      CONSTRAINT "fk_ticket_evidences_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_ticket_evidences_technician" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_ticket_evidences_assignment" FOREIGN KEY ("assignment_id") REFERENCES "assignment_histories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_ticket_evidences_public_id" ON "ticket_evidences" ("public_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_ticket_evidences_ticket_created_at" ON "ticket_evidences" ("ticket_id", "created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM "ticket_evidences")
          OR EXISTS (SELECT 1 FROM "tickets")
          OR EXISTS (SELECT 1 FROM "assets")
          OR EXISTS (SELECT 1 FROM "locations") THEN
          RAISE EXCEPTION
            'Cannot revert ticket asset migration while its data exists.';
        END IF;
      END $$;
    `);

    await queryRunner.query(
      `DROP INDEX "public"."idx_ticket_evidences_ticket_created_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_ticket_evidences_public_id"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_evidences"`);
    await queryRunner.query(`DROP TYPE "ticket_evidence_type"`);
    await queryRunner.query(`DROP INDEX "public"."uq_tickets_open_asset"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tickets_asset"`);
    await queryRunner.query(
      `ALTER TABLE "tickets" DROP CONSTRAINT "fk_tickets_asset"`,
    );
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "asset_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_tickets_ticket_code"`,
    );
    await queryRunner.query(`ALTER TABLE "tickets" DROP COLUMN "ticket_code"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_assets_serial_number"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_assets_asset_code"`,
    );
    await queryRunner.query(`DROP TABLE "assets"`);
    await queryRunner.query(`DROP INDEX "public"."uq_locations_code"`);
    await queryRunner.query(`DROP TABLE "locations"`);
    await queryRunner.query(`DROP SEQUENCE "ticket_code_sequence"`);
  }
}
