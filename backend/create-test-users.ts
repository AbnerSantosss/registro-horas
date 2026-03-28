import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();

async function main() {
  console.log("Criando usuários de teste para validar horas...");

  const defaultPassword = 'senha';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const testUsers = [
    {
      id: 'usr_admin_teste',
      name: 'Admin Teste',
      email: 'admin_teste@geralbet.com',
      passwordHash,
      role: 'admin',
      position: 'Administrador/Dono',
      brands: JSON.stringify(['geralbet', 'certeiro', 'liderbet'])
    },
    {
      id: 'usr_gerente_teste',
      name: 'Gerente Teste',
      email: 'gerente@geralbet.com',
      passwordHash,
      role: 'colaborador',
      position: 'Gerente de Projetos',
      brands: JSON.stringify(['geralbet', 'certeiro', 'liderbet'])
    },
    {
      id: 'usr_designer_teste',
      name: 'Designer Teste',
      email: 'designer@geralbet.com',
      passwordHash,
      role: 'colaborador',
      position: 'Designer Gráfico',
      brands: JSON.stringify(['geralbet'])
    },
    {
      id: 'usr_dev_teste',
      name: 'Dev Teste',
      email: 'dev@geralbet.com',
      passwordHash,
      role: 'colaborador',
      position: 'Programador',
      brands: JSON.stringify(['certeiro', 'liderbet'])
    }
  ];

  for (const user of testUsers) {
    await p.user.upsert({
      where: { email: user.email },
      update: {}, // if exist, leave alone or update? maybe update to reset password if needed
      create: user
    });
    console.log(`- Usuário: ${user.name} | Email: ${user.email} | Função: ${user.position} | Nível: ${user.role} | Marcas Permitidas: ${user.brands}`);
  }

  console.log("\nUsuários criados com sucesso! Autentique com a senha 'senha' para testá-los.");
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await p.$disconnect();
  });
