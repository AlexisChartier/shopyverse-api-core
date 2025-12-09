-- CreateTable
CREATE TABLE "StoreSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "shippingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "allowedPaymentMethods" TEXT[] DEFAULT ARRAY['card', 'paypal']::TEXT[],
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "orderPrefix" TEXT NOT NULL DEFAULT 'ORD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("id")
);
