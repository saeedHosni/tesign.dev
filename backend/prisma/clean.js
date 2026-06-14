import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.cartItem.deleteMany({});
await prisma.orderItem.deleteMany({});
await prisma.orderDownload.deleteMany({});
await prisma.productImage.deleteMany({});
await prisma.wishlistItem.deleteMany({});
await prisma.review.deleteMany({});
await prisma.productFeature.deleteMany({});
await prisma.productFAQ.deleteMany({});
await prisma.productChangelog.deleteMany({});
await prisma.productStat.deleteMany({});
await prisma.product.deleteMany({});
await prisma.category.deleteMany({});

console.log('✓ پاکسازی انجام شد');