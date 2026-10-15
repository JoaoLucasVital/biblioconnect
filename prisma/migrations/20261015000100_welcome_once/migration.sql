ALTER TABLE "Usuario" ADD COLUMN "welcomeSeenAt" TIMESTAMP(3);
-- Existing readers have already met the library. Future accounts start unclaimed.
UPDATE "Usuario" SET "welcomeSeenAt" = CURRENT_TIMESTAMP;
