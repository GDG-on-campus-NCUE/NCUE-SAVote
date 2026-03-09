import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding administrative permissions...');

  // 1. Create/Update Initial Super Admin Permission
  // We use double backslash for the hardcoded fallback
  const superAdminSub =
    process.env.INITIAL_SUPER_ADMIN_SUB || 'NCUESA\\S1354032';
  const superAdminName = process.env.INITIAL_SUPER_ADMIN_NAME || '陳泰銘';

  // We use upsert to ensure that if the record exists, it gets updated with the correct role/name
  await prisma.adminPermission.upsert({
    where: { synologySub: superAdminSub },
    update: {
      role: UserRole.SUPER_ADMIN,
      name: superAdminName,
    },
    create: {
      synologySub: superAdminSub,
      role: UserRole.SUPER_ADMIN,
      name: superAdminName,
    },
  });

  console.log(
    `✅ Super admin synchronized: ${superAdminName} (sub: ${superAdminSub})`,
  );
  console.log('Seed completed successfully.');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
