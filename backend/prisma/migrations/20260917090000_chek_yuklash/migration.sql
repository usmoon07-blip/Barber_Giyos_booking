-- AlterTable
-- Mijoz yuborgan to'lov cheki (Telegram file_id) va yuborilgan vaqti.
ALTER TABLE "Appointment" ADD COLUMN     "receiptFileId" TEXT,
ADD COLUMN     "receiptSentAt" TIMESTAMP(3);
