import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

const COUNT = Number(process.env.COUNT || 10000);
const OUT = process.env.OUT || path.join(process.cwd(), 'prisma', 'data', 'products-10k.json');

const categories = [
  { id: 'cat-audio', name: 'Audio' },
  { id: 'cat-maison', name: 'Maison' },
  { id: 'cat-mode', name: 'Mode' },
  { id: 'cat-sport', name: 'Sport' },
  { id: 'cat-beaute', name: 'Beauté' },
];

function randomPrice(index) {
  const base = 9.9 + (index % 200);
  return Math.round(base * 100) / 100;
}

function buildProduct(index) {
  const category = categories[index % categories.length];
  const slug = `produit-${index + 1}`;
  const title = `Produit ${index + 1}`;
  const sku = `SKU-${index + 1}`;
  const price = randomPrice(index);
  const compareAt = price + Math.round((index % 5) * 3);
  return {
    id: randomUUID(),
    title,
    description: `Description détaillée du ${title}.`,
    slug,
    isPublished: true,
    categoryId: category.id,
    category,
    variants: [
      {
        id: randomUUID(),
        sku,
        price,
        stockQty: 20 + (index % 30),
        attributes: {
          color: ['noir', 'blanc', 'bleu', 'vert'][index % 4],
          size: ['S', 'M', 'L', 'XL'][index % 4],
          compareAtPrice: compareAt,
        },
      },
    ],
    medias: [
      {
        id: randomUUID(),
        url: `https://picsum.photos/seed/p-${index + 1}/800/800`,
        altText: title,
        sortOrder: 0,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function main() {
  console.log(`Génération de ${COUNT} produits vers ${OUT}`);
  const products = Array.from({ length: COUNT }, (_, i) => buildProduct(i));

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ categories, products }, null, 2), 'utf-8');
  console.log('Dataset écrit.');
}

main();
