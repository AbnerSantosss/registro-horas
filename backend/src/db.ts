import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

export async function initDb() {
  // With MySQL + Prisma, the schema is managed by `prisma db push` or `prisma migrate`.
  // This function now only ensures the default admin user exists.

  try {
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@runtask.com' },
    });

    if (!adminExists) {
      const passwordHash = bcrypt.hashSync('admin123', 10);
      await prisma.user.create({
        data: {
          id: 'admin-id-123',
          name: 'Admin User',
          email: 'admin@runtask.com',
          passwordHash,
          role: 'admin',
          position: 'Administrator',
        },
      });
      console.log('Default admin created: admin@runtask.com / admin123');
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

export default prisma;
