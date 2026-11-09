-- CreateTable
CREATE TABLE "access_credentials" (
    "id" TEXT NOT NULL,
    "member_id" TEXT NOT NULL,
    "credential_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_reason" TEXT,

    CONSTRAINT "access_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_log" (
    "id" TEXT NOT NULL,
    "member_id" TEXT,
    "location_id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "granted" BOOLEAN NOT NULL,
    "reason" TEXT NOT NULL,

    CONSTRAINT "access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "access_credentials_credential_hash_key" ON "access_credentials"("credential_hash");

-- CreateIndex
CREATE INDEX "access_credentials_member_id_is_active_idx" ON "access_credentials"("member_id", "is_active");

-- CreateIndex
CREATE INDEX "access_log_location_id_timestamp_idx" ON "access_log"("location_id", "timestamp");
