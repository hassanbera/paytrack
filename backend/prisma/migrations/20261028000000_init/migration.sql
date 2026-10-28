-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "clientName" VARCHAR(100) NOT NULL,
    "clientEmail" VARCHAR(200) NOT NULL DEFAULT '',
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "number" INTEGER NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidCents" INTEGER NOT NULL DEFAULT 0,
    "dueDate" DATE NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "installmentId" UUID NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "note" VARCHAR(300) NOT NULL DEFAULT '',
    "idempotencyKey" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Installment_dueDate_idx" ON "Installment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Installment_planId_number_key" ON "Installment"("planId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_installmentId_createdAt_idx" ON "Payment"("installmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "Installment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
