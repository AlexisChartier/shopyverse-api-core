import { OrderStatus, PaymentStatus, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  const passwordHash = await bcrypt.hash('Admin123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@shopyverse.test' },
    update: {
      password: passwordHash,
      roleId: adminRole.id,
    },
    create: {
      email: 'admin@shopyverse.test',
      password: passwordHash,
      firstName: 'Alex',
      lastName: 'Admin',
      roleId: adminRole.id,
    },
  });
}

async function createCatalog() {
  const electronics = await prisma.category.upsert({
    where: { id: 'cat-electronics' },
    update: {},
    create: {
      id: 'cat-electronics',
      name: 'Électronique',
    },
  });

  const lifestyle = await prisma.category.upsert({
    where: { id: 'cat-lifestyle' },
    update: {},
    create: {
      id: 'cat-lifestyle',
      name: 'Lifestyle',
    },
  });

  const smartSpeaker = await prisma.product.upsert({
    where: { slug: 'enceinte-connectee' },
    update: {},
    create: {
      title: 'Enceinte connectée NovaOne',
      description:
        "Enceinte multiroom avec assistant vocal intégré et optimisation automatique de la pièce.",
      slug: 'enceinte-connectee',
      isPublished: true,
      categoryId: electronics.id,
      variants: {
        create: [
          {
            sku: 'NOV-001',
            attributes: { color: 'Noir', size: 'Standard' },
            price: '199.90',
            stockQty: 25,
            alertThreshold: 5,
          },
        ],
      },
      medias: {
        create: [
          {
            url: 'https://picsum.photos/seed/novaone/800/800',
            altText: 'Enceinte connectée NovaOne',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  const smartLight = await prisma.product.upsert({
    where: { slug: 'ampoule-intelligente' },
    update: {},
    create: {
      title: 'Ampoules intelligentes GlowKit (pack de 4)',
      description: 'Ampoules LED RGB connectées avec automatisations et scènes dynamiques.',
      slug: 'ampoule-intelligente',
      isPublished: true,
      categoryId: lifestyle.id,
      variants: {
        create: [
          {
            sku: 'GLW-4PK',
            attributes: { color: 'RGB', size: 'E27' },
            price: '89.90',
            stockQty: 60,
            alertThreshold: 10,
          },
        ],
      },
      medias: {
        create: [
          {
            url: 'https://picsum.photos/seed/glowkit/800/800',
            altText: 'Ampoules intelligentes GlowKit',
            sortOrder: 0,
          },
        ],
      },
    },
  });

  return { electronics, lifestyle, smartSpeaker, smartLight };
}

async function createCustomersAndOrders(products: string[]) {
  const sophie = await prisma.customer.upsert({
    where: { email: 'sophie.martin@example.com' },
    update: {},
    create: {
      firstName: 'Sophie',
      lastName: 'Martin',
      email: 'sophie.martin@example.com',
      phone: '+33 6 01 02 03 04',
    },
  });

  const yassine = await prisma.customer.upsert({
    where: { email: 'yassine.leroy@example.com' },
    update: {},
    create: {
      firstName: 'Yassine',
      lastName: 'Leroy',
      email: 'yassine.leroy@example.com',
      phone: '+33 7 11 22 33 44',
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-1001' },
    update: {},
    create: {
      orderNumber: 'ORD-1001',
      status: OrderStatus.PROCESSING,
      paymentStatus: PaymentStatus.PAID,
      subtotal: '199.90',
      tax: '39.98',
      shipping: '9.90',
      total: '249.78',
      shippingAddress: {
        street: '12 rue Oberkampf',
        city: 'Paris',
        state: 'Île-de-France',
        postalCode: '75011',
        country: 'France',
      },
      customerId: sophie.id,
      items: {
        create: [
          {
            productId: products[0],
            productName: 'Enceinte connectée NovaOne',
            quantity: 1,
            unitPrice: '199.90',
            imageUrl: 'https://picsum.photos/seed/novaone/200/200',
          },
        ],
      },
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-1002' },
    update: {},
    create: {
      orderNumber: 'ORD-1002',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      subtotal: '89.90',
      tax: '17.98',
      shipping: '6.90',
      total: '114.78',
      shippingAddress: {
        street: '8 avenue du Tech',
        city: 'Lyon',
        state: 'Auvergne-Rhône-Alpes',
        postalCode: '69003',
        country: 'France',
      },
      customerId: yassine.id,
      items: {
        create: [
          {
            productId: products[1],
            productName: 'Ampoules intelligentes GlowKit (pack de 4)',
            quantity: 1,
            unitPrice: '89.90',
            imageUrl: 'https://picsum.photos/seed/glowkit/200/200',
          },
        ],
      },
    },
  });
}

async function createCustomPages() {
  await prisma.customPage.upsert({
    where: { slug: 'home' },
    update: {
      name: 'Accueil',
      description: 'Page d’accueil générée automatiquement',
      theme: 'default',
      isPublished: true,
      isInMenu: true,
    },
    create: {
      name: 'Accueil',
      slug: 'home',
      description: 'Page d’accueil générée automatiquement',
      theme: 'default',
      isPublished: true,
      isInMenu: true,
      sections: {
        create: [
          {
            type: 'heading',
            content: 'Bienvenue sur ShopyVerse',
            level: 1,
            sortOrder: 0,
          },
          {
            type: 'paragraph',
            content:
              'Gérez vos produits, vos collections et vos expériences clients depuis une seule interface.',
            sortOrder: 1,
          },
        ],
      },
    },
  });

  await prisma.customPage.upsert({
    where: { slug: 'about' },
    update: {
      name: 'À propos',
      description: 'Notre histoire',
      isPublished: true,
      isInMenu: true,
    },
    create: {
      name: 'À propos',
      slug: 'about',
      description: 'Notre histoire',
      isPublished: true,
      isInMenu: true,
      sections: {
        create: [
          {
            type: 'heading',
            content: 'Notre mission',
            level: 2,
            sortOrder: 0,
          },
          {
            type: 'paragraph',
            content: 'Nous aidons les marchands à lancer une boutique complète en quelques minutes.',
            sortOrder: 1,
          },
        ],
      },
    },
  });
}

async function main() {
  console.log('🌱  Seeding database...');

  await createAdminUser();
  const { smartSpeaker, smartLight } = await createCatalog();
  await createCustomersAndOrders([smartSpeaker.id, smartLight.id]);
  await createCustomPages();

  console.log('✅  Seed complete. You can log in with admin@shopyverse.test / Admin123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });