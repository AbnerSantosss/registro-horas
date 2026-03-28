import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('senha', 10);
  
  const user = {
    id: 'usr_redator_teste',
    name: 'Redator Teste',
    email: 'redator@geralbet.com',
    passwordHash,
    role: 'colaborador',
    position: 'Redator',
    brands: JSON.stringify(['geralbet', 'certeiro', 'liderbet'])
  };

  await p.user.upsert({
    where: { email: user.email },
    update: {},
    create: user
  });
  
  console.log('Usuário Redator criado: redator@geralbet.com / senha');
}

main().finally(() => p.$disconnect());
