-- AlterTable
ALTER TABLE "users" ADD COLUMN "carry_over_balance" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "current_cycle_start" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "monthly_summaries" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "total_income" INTEGER NOT NULL,
    "total_expenses" INTEGER NOT NULL,
    "net_saved" INTEGER NOT NULL,
    "transaction_count" INTEGER NOT NULL,
    "top_categories" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "monthly_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "monthly_summaries_user_id_year_month_idx" ON "monthly_summaries"("user_id", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_summaries_user_id_year_month_key" ON "monthly_summaries"("user_id", "year", "month");

-- AddForeignKey
ALTER TABLE "monthly_summaries" ADD CONSTRAINT "monthly_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
