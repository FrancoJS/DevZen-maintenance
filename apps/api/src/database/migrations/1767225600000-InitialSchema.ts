import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1767225600000 implements MigrationInterface {
  name = 'InitialSchema1767225600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await queryRunner.query(
      `CREATE TYPE "user_role" AS ENUM ('REQUESTER', 'TECHNICIAN', 'ADMIN')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ticket_priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ticket_status" AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED', 'FROZEN', 'PENDING_REASSIGNMENT', 'RESOLVED', 'CLOSED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "equipment_stopped" AS ENUM ('YES', 'PARTIAL', 'NO')`,
    );
    await queryRunner.query(
      `CREATE TYPE "production_impact" AS ENUM ('STOPPED', 'REDUCED', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "freeze_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "freeze_reason_type" AS ENUM ('SPARE_PART_UNAVAILABLE', 'AWAITING_AUTHORIZATION', 'SPECIALIST_UNAVAILABLE', 'EQUIPMENT_OR_AREA_UNAVAILABLE', 'OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "assignment_release_reason" AS ENUM ('FREEZE_APPROVED', 'RESOLVED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "ticket_history_action" AS ENUM ('TICKET_CREATED', 'TICKET_UPDATED', 'PRIORITY_CALCULATED', 'PRIORITY_OVERRIDDEN', 'TECHNICIAN_ASSIGNED', 'MAINTENANCE_STARTED', 'MAINTENANCE_UPDATED', 'FREEZE_REQUESTED', 'FREEZE_APPROVED', 'FREEZE_REJECTED', 'BLOCKER_RESOLVED', 'TICKET_RESOLVED', 'TICKET_CLOSED')`,
    );

    await queryRunner.query(`CREATE TABLE "users" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "name" character varying(120) NOT NULL,
      "email" character varying(320) NOT NULL,
      "password_hash" character varying(255) NOT NULL,
      "role" "user_role" NOT NULL,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
    )`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email_lower" ON "users" (LOWER("email"))`,
    );

    await queryRunner.query(`CREATE TABLE "tickets" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "description" character varying(1000) NOT NULL,
      "location" character varying(200) NOT NULL,
      "asset" character varying(200) NOT NULL,
      "priority" "ticket_priority" NOT NULL,
      "status" "ticket_status" NOT NULL DEFAULT 'NEW',
      "requester_id" uuid NOT NULL,
      "current_technician_id" uuid,
      "resolved_by_id" uuid,
      "closed_by_id" uuid,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "resolved_at" TIMESTAMP WITH TIME ZONE,
      "closed_at" TIMESTAMP WITH TIME ZONE,
      CONSTRAINT "PK_tickets_id" PRIMARY KEY ("id"),
      CONSTRAINT "chk_tickets_current_technician_by_status" CHECK (("status" IN ('ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED') AND "current_technician_id" IS NOT NULL) OR ("status" NOT IN ('ASSIGNED', 'IN_PROGRESS', 'FREEZE_REQUESTED') AND "current_technician_id" IS NULL)),
      CONSTRAINT "chk_tickets_resolution_fields" CHECK (("status" IN ('RESOLVED', 'CLOSED') AND "resolved_at" IS NOT NULL AND "resolved_by_id" IS NOT NULL) OR ("status" NOT IN ('RESOLVED', 'CLOSED') AND "resolved_at" IS NULL AND "resolved_by_id" IS NULL)),
      CONSTRAINT "chk_tickets_closure_fields" CHECK (("status" = 'CLOSED' AND "closed_at" IS NOT NULL AND "closed_by_id" IS NOT NULL) OR ("status" <> 'CLOSED' AND "closed_at" IS NULL AND "closed_by_id" IS NULL))
    )`);
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "fk_tickets_requester" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "fk_tickets_current_technician" FOREIGN KEY ("current_technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "fk_tickets_resolved_by" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tickets" ADD CONSTRAINT "fk_tickets_closed_by" FOREIGN KEY ("closed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tickets_status" ON "tickets" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tickets_priority" ON "tickets" ("priority")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tickets_requester_created_at" ON "tickets" ("requester_id", "created_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_tickets_current_technician" ON "tickets" ("current_technician_id")`,
    );

    await queryRunner.query(`CREATE TABLE "impact_assessments" (
      "ticket_id" uuid NOT NULL,
      "safety_risk" boolean NOT NULL,
      "equipment_stopped" "equipment_stopped" NOT NULL,
      "production_impact" "production_impact" NOT NULL,
      "workaround_available" boolean NOT NULL,
      "affects_other_areas" boolean NOT NULL,
      "calculated_priority" "ticket_priority" NOT NULL,
      CONSTRAINT "PK_impact_assessments_ticket_id" PRIMARY KEY ("ticket_id"),
      CONSTRAINT "fk_impact_assessments_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);

    await queryRunner.query(`CREATE TABLE "maintenances" (
      "ticket_id" uuid NOT NULL,
      "diagnosis" text,
      "work_performed" text,
      "notes" text,
      "final_evidence_url" character varying(2048),
      CONSTRAINT "PK_maintenances_ticket_id" PRIMARY KEY ("ticket_id"),
      CONSTRAINT "fk_maintenances_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);

    await queryRunner.query(`CREATE TABLE "freeze_requests" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ticket_id" uuid NOT NULL,
      "technician_id" uuid NOT NULL,
      "reason_type" "freeze_reason_type" NOT NULL,
      "reason_detail" text,
      "status" "freeze_request_status" NOT NULL DEFAULT 'PENDING',
      "requested_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "reviewed_by_id" uuid,
      "reviewed_at" TIMESTAMP WITH TIME ZONE,
      "review_note" text,
      CONSTRAINT "PK_freeze_requests_id" PRIMARY KEY ("id"),
      CONSTRAINT "chk_freeze_requests_other_detail" CHECK ("reason_type" <> 'OTHER' OR NULLIF(BTRIM("reason_detail"), '') IS NOT NULL),
      CONSTRAINT "chk_freeze_requests_review_fields" CHECK (("status" = 'PENDING' AND "reviewed_by_id" IS NULL AND "reviewed_at" IS NULL) OR ("status" IN ('APPROVED', 'REJECTED') AND "reviewed_by_id" IS NOT NULL AND "reviewed_at" IS NOT NULL)),
      CONSTRAINT "fk_freeze_requests_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_freeze_requests_technician" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_freeze_requests_reviewed_by" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(
      `CREATE INDEX "idx_freeze_requests_status_requested_at" ON "freeze_requests" ("status", "requested_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_freeze_requests_pending_ticket" ON "freeze_requests" ("ticket_id") WHERE "status" = 'PENDING'`,
    );

    await queryRunner.query(`CREATE TABLE "assignment_histories" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ticket_id" uuid NOT NULL,
      "technician_id" uuid NOT NULL,
      "assigned_by_id" uuid NOT NULL,
      "assigned_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      "started_at" TIMESTAMP WITH TIME ZONE,
      "released_at" TIMESTAMP WITH TIME ZONE,
      "release_reason" "assignment_release_reason",
      CONSTRAINT "PK_assignment_histories_id" PRIMARY KEY ("id"),
      CONSTRAINT "chk_assignment_histories_release_fields" CHECK (("released_at" IS NULL AND "release_reason" IS NULL) OR ("released_at" IS NOT NULL AND "release_reason" IS NOT NULL)),
      CONSTRAINT "fk_assignment_histories_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_assignment_histories_technician" FOREIGN KEY ("technician_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_assignment_histories_assigned_by" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(
      `CREATE INDEX "idx_assignment_histories_ticket_assigned_at" ON "assignment_histories" ("ticket_id", "assigned_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_assignment_histories_technician_assigned_at" ON "assignment_histories" ("technician_id", "assigned_at")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_assignment_histories_active_ticket" ON "assignment_histories" ("ticket_id") WHERE "released_at" IS NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_assignment_histories_active_technician" ON "assignment_histories" ("technician_id") WHERE "released_at" IS NULL`,
    );

    await queryRunner.query(`CREATE TABLE "ticket_histories" (
      "id" uuid NOT NULL DEFAULT gen_random_uuid(),
      "ticket_id" uuid NOT NULL,
      "actor_id" uuid NOT NULL,
      "action" "ticket_history_action" NOT NULL,
      "previous_status" "ticket_status",
      "new_status" "ticket_status",
      "previous_priority" "ticket_priority",
      "new_priority" "ticket_priority",
      "details" jsonb,
      "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      CONSTRAINT "PK_ticket_histories_id" PRIMARY KEY ("id"),
      CONSTRAINT "fk_ticket_histories_ticket" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION,
      CONSTRAINT "fk_ticket_histories_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION
    )`);
    await queryRunner.query(
      `CREATE INDEX "idx_ticket_histories_ticket_created_at_id" ON "ticket_histories" ("ticket_id", "created_at", "id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."idx_ticket_histories_ticket_created_at_id"`,
    );
    await queryRunner.query(`DROP TABLE "ticket_histories"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_assignment_histories_active_technician"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."uq_assignment_histories_active_ticket"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_assignment_histories_technician_assigned_at"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_assignment_histories_ticket_assigned_at"`,
    );
    await queryRunner.query(`DROP TABLE "assignment_histories"`);
    await queryRunner.query(
      `DROP INDEX "public"."uq_freeze_requests_pending_ticket"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_freeze_requests_status_requested_at"`,
    );
    await queryRunner.query(`DROP TABLE "freeze_requests"`);
    await queryRunner.query(`DROP TABLE "maintenances"`);
    await queryRunner.query(`DROP TABLE "impact_assessments"`);
    await queryRunner.query(
      `DROP INDEX "public"."idx_tickets_current_technician"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."idx_tickets_requester_created_at"`,
    );
    await queryRunner.query(`DROP INDEX "public"."idx_tickets_priority"`);
    await queryRunner.query(`DROP INDEX "public"."idx_tickets_status"`);
    await queryRunner.query(`DROP TABLE "tickets"`);
    await queryRunner.query(`DROP INDEX "public"."uq_users_email_lower"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "ticket_history_action"`);
    await queryRunner.query(`DROP TYPE "assignment_release_reason"`);
    await queryRunner.query(`DROP TYPE "freeze_reason_type"`);
    await queryRunner.query(`DROP TYPE "freeze_request_status"`);
    await queryRunner.query(`DROP TYPE "production_impact"`);
    await queryRunner.query(`DROP TYPE "equipment_stopped"`);
    await queryRunner.query(`DROP TYPE "ticket_status"`);
    await queryRunner.query(`DROP TYPE "ticket_priority"`);
    await queryRunner.query(`DROP TYPE "user_role"`);
  }
}
