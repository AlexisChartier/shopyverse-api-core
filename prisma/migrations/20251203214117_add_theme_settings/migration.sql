-- CreateTable
CREATE TABLE "ThemeSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "primaryColor" TEXT NOT NULL DEFAULT '#030213',
    "secondaryColor" TEXT NOT NULL DEFAULT '#6366f1',
    "accentColor" TEXT NOT NULL DEFAULT '#f59e0b',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "logo" TEXT,
    "storeName" TEXT NOT NULL DEFAULT 'Ma Boutique',
    "storeDescription" TEXT NOT NULL DEFAULT 'Découvrez nos produits de qualité supérieure',
    "headerLayout" TEXT NOT NULL DEFAULT 'centered',
    "footerText" TEXT NOT NULL DEFAULT '© 2024 Ma Boutique. Tous droits réservés.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThemeSetting_pkey" PRIMARY KEY ("id")
);
