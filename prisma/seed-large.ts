import fs from 'fs';
import path from 'path';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 200);
const LIMIT = process.env.LIMIT ? Number(process.env.LIMIT) : undefined;

interface DatasetCategory {
  id: string;
  name: string;
}

interface DatasetVariant {
  id?: string;
  sku: string;
  price: number;
  stockQty?: number;
  alertThreshold?: number;
  attributes?: Record<string, unknown>;
}

interface DatasetMedia {
  id?: string;
  url: string;
  altText?: string | null;
  sortOrder?: number | null;
}

interface DatasetProduct {
  id?: string;
  title: string;
  description: string;
  slug: string;
  isPublished?: boolean;
  categoryId: string;
  variants: DatasetVariant[];
  medias: DatasetMedia[];
}

interface DatasetFile {
  categories: DatasetCategory[];
  products: DatasetProduct[];
}

function loadDataset(): DatasetFile {
  const datasetPath = process.env.DATASET_PATH || path.join(process.cwd(), 'prisma', 'data', 'products-10k.json');
  const content = fs.readFileSync(datasetPath, 'utf-8');
  const parsed = JSON.parse(content) as DatasetFile;
  if (!parsed.products?.length) {
    throw new Error('Dataset vide ou invalide');
  }
  return parsed;
}

async function upsertCategories(categories: DatasetCategory[]) {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { name: category.name },
      create: { id: category.id, name: category.name },
    });
  }
}

async function insertProducts(products: DatasetProduct[]) {
  const chunks: DatasetProduct[][] = [];
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    chunks.push(products.slice(i, i + BATCH_SIZE));
  }

  for (const [index, chunk] of chunks.entries()) {
    await prisma.$transaction(
      chunk.map((product) =>
        prisma.product.create({
          data: {
            id: product.id,
            title: product.title,
            description: product.description,
            slug: product.slug,
            isPublished: product.isPublished ?? true,
            categoryId: product.categoryId,
            variants: {
              create: product.variants.map((variant) => ({
                id: variant.id,
                sku: variant.sku,
                attributes: (variant.attributes ?? {}) as Prisma.InputJsonValue,
                price: new Prisma.Decimal(variant.price),
                stockQty: variant.stockQty ?? 0,
                alertThreshold: variant.alertThreshold ?? 5,
              })),
            },
            medias: {
              create: product.medias.map((media) => ({
                id: media.id,
                url: media.url,
                altText: media.altText ?? null,
                sortOrder: media.sortOrder ?? 0,
              })),
            },
          },
        }),
      ),
    );
    console.log(`Batch ${index + 1}/${chunks.length} inséré (${chunk.length} produits)`);
  }
}

async function main() {
  const dataset = loadDataset();
  const products = LIMIT ? dataset.products.slice(0, LIMIT) : dataset.products;
  console.log(`Chargement d'${products.length} produits (batch=${BATCH_SIZE})`);

  await upsertCategories(dataset.categories);
  await insertProducts(products);
}

main()
  .catch((error) => {
    console.error('Erreur de seed massif', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
