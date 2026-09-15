-- CreateEnum
CREATE TYPE "UserSource" AS ENUM ('TELEGRAM', 'WALK_IN');

-- CreateEnum
CREATE TYPE "AppointmentSource" AS ENUM ('MINIAPP', 'ADMIN');

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'NO_SHOW';

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "source" "AppointmentSource" NOT NULL DEFAULT 'MINIAPP';

-- AlterTable
ALTER TABLE "SiteSetting" ADD COLUMN     "autoComplete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelDeadlineHours" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "source" "UserSource" NOT NULL DEFAULT 'TELEGRAM',
ALTER COLUMN "telegramId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TimeBlock" (
    "id" SERIAL NOT NULL,
    "barberId" INTEGER,
    "date" DATE NOT NULL,
    "startTime" TEXT NOT NULL DEFAULT '09:00',
    "endTime" TEXT NOT NULL DEFAULT '20:00',
    "isFullDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeBlock_date_barberId_idx" ON "TimeBlock"("date", "barberId");

-- AddForeignKey
ALTER TABLE "TimeBlock" ADD CONSTRAINT "TimeBlock_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
