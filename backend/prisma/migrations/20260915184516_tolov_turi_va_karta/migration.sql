-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'CARD');

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "cardBank" TEXT,
ADD COLUMN     "cardHolder" TEXT,
ADD COLUMN     "cardNumber" TEXT,
ADD COLUMN     "cardPaymentEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cashPaymentEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "Appointment_date_isPaid_idx" ON "Appointment"("date", "isPaid");
