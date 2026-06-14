-- Fix migration: بازسازی جداول تیکت که توسط migration اشتباه DROP شدند

-- اگر جداول هنوز وجود دارند، ابتدا DROP کن (برای safety)
DROP TABLE IF EXISTS "ticket_attachments" CASCADE;
DROP TABLE IF EXISTS "ticket_messages" CASCADE;
DROP TABLE IF EXISTS "tickets" CASCADE;
DROP TYPE IF EXISTS "TicketDepartment";
DROP TYPE IF EXISTS "TicketPriority";
DROP TYPE IF EXISTS "TicketStatus";

-- Enums
CREATE TYPE "TicketDepartment" AS ENUM ('SUPPORT','TECHNICAL','SALES','ORDER');
CREATE TYPE "TicketPriority"   AS ENUM ('LOW','MEDIUM','HIGH');
CREATE TYPE "TicketStatus"     AS ENUM ('OPEN','ANSWERED','PENDING','CLOSED');

-- جدول تیکت
CREATE TABLE "tickets" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ticketNumber" TEXT NOT NULL,
  "userId"       TEXT NOT NULL,
  "orderId"      TEXT,
  "department"   "TicketDepartment" NOT NULL DEFAULT 'SUPPORT',
  "priority"     "TicketPriority"   NOT NULL DEFAULT 'MEDIUM',
  "status"       "TicketStatus"     NOT NULL DEFAULT 'OPEN',
  "subject"      TEXT NOT NULL,
  "assignedTo"   TEXT,
  "closedAt"     TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tickets_ticketNumber_key" ON "tickets"("ticketNumber");
CREATE INDEX "tickets_userId_idx"    ON "tickets"("userId");
CREATE INDEX "tickets_status_idx"    ON "tickets"("status");
CREATE INDEX "tickets_createdAt_idx" ON "tickets"("createdAt");
CREATE INDEX "tickets_orderId_idx"   ON "tickets"("orderId");

-- جدول پیام‌ها
CREATE TABLE "ticket_messages" (
  "id"         TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "ticketId"   TEXT NOT NULL,
  "senderId"   TEXT NOT NULL,
  "senderRole" TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "isInternal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- جدول پیوست‌ها
CREATE TABLE "ticket_attachments" (
  "id"           TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "messageId"    TEXT NOT NULL,
  "filename"     TEXT NOT NULL,
  "originalName" TEXT,
  "url"          TEXT NOT NULL,
  "mimetype"     TEXT,
  "size"         INTEGER,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ticket_attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ticket_attachments_messageId_idx" ON "ticket_attachments"("messageId");

-- Foreign Keys
ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "tickets"
  ADD CONSTRAINT "tickets_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL;

ALTER TABLE "ticket_messages"
  ADD CONSTRAINT "ticket_messages_ticketId_fkey"
    FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE;

ALTER TABLE "ticket_messages"
  ADD CONSTRAINT "ticket_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE;

ALTER TABLE "ticket_attachments"
  ADD CONSTRAINT "ticket_attachments_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "ticket_messages"("id") ON DELETE CASCADE;

-- Trigger: auto-update updatedAt تیکت هنگام ثبت پیام جدید
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE "tickets" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = NEW."ticketId";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_message_updates_ticket ON "ticket_messages";
CREATE TRIGGER ticket_message_updates_ticket
  AFTER INSERT ON "ticket_messages"
  FOR EACH ROW EXECUTE FUNCTION update_ticket_updated_at();