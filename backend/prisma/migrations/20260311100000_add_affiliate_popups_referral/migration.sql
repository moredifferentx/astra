-- AlterTable
ALTER TABLE "users" ADD COLUMN "referral_code" TEXT,
ADD COLUMN "referred_by" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- AlterTable: Add Discord popup fields to site_settings
ALTER TABLE "site_settings" ADD COLUMN "discord_invite_url" TEXT,
ADD COLUMN "discord_popup_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: referrals
CREATE TABLE "referrals" (
    "id" SERIAL NOT NULL,
    "referrer_id" INTEGER NOT NULL,
    "referred_id" INTEGER NOT NULL,
    "coins_awarded" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "referrals_referred_id_key" ON "referrals"("referred_id");
CREATE INDEX "referrals_referrer_id_idx" ON "referrals"("referrer_id");

ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: affiliate_settings
CREATE TABLE "affiliate_settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "coins_per_referral" INTEGER NOT NULL DEFAULT 50,
    "discount_percent" INTEGER NOT NULL DEFAULT 10,
    "discord_claim_required" BOOLEAN NOT NULL DEFAULT true,
    "discord_server_url" TEXT,

    CONSTRAINT "affiliate_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable: popup_messages
CREATE TABLE "popup_messages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "image_url" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "show_once" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "popup_messages_pkey" PRIMARY KEY ("id")
);
