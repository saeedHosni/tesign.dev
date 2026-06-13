import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.cartItem.deleteMany({});
await prisma.orderItem.deleteMany({});
await prisma.orderDownload.deleteMany({});
await prisma.productImage.deleteMany({});
await prisma.wishlistItem.deleteMany({});
await prisma.review.deleteMany({});
await prisma.product.deleteMany({});
await prisma.category.deleteMany({});
await prisma.$disconnect();

console.log('✓ پاکسازی انجام شد');