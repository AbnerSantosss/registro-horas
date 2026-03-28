import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  console.log("Updating brands...");

  await p.brand.update({
    where: { id: 'certeiro' },
    data: {
      logoUrl: '/logos/Certeiro - Logo.png',
      iconUrl: '/logos/icon_certeiro.png'
    }
  });

  await p.brand.update({
    where: { id: 'geralbet' },
    data: {
      logoUrl: '/logos/geralbet-azul.png',
      iconUrl: '/logos/icon_geralbet_azul.png'
    }
  });

  await p.brand.update({
    where: { id: 'liderbet' },
    data: {
      logoUrl: '/logos/liderbet-preto.png',
      iconUrl: '/logos/icon_liderbet_preto.png'
    }
  });

  console.log("Brands updated!");
  const brands = await p.brand.findMany();
  console.log(JSON.stringify(brands, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await p.$disconnect();
  });
