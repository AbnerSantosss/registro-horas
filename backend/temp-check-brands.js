import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const brands = await p.brand.findMany();
  console.log(JSON.stringify(brands, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await p.$disconnect();
  });
