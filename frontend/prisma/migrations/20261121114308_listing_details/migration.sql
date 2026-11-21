-- Only ADD COLUMN: recreating the Car table would, on Turso, cascade-delete
-- its photos, favorites and inquiries.
ALTER TABLE "Car" ADD COLUMN "bodyType" TEXT;
ALTER TABLE "Car" ADD COLUMN "exteriorColor" TEXT;
ALTER TABLE "Car" ADD COLUMN "interiorColor" TEXT;
ALTER TABLE "Car" ADD COLUMN "horsepower" INTEGER;
ALTER TABLE "Car" ADD COLUMN "steering" TEXT;
ALTER TABLE "Car" ADD COLUMN "condition" TEXT NOT NULL DEFAULT 'Used';
ALTER TABLE "Car" ADD COLUMN "vin" TEXT;
ALTER TABLE "Car" ADD COLUMN "priceOnRequest" BOOLEAN NOT NULL DEFAULT false;
