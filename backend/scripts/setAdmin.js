const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: node scripts/setAdmin.js <email>');
    process.exit(1);
  }

  const user = await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: { role: 'admin' },
  });

  console.log(`✓ ${user.email} is now an admin (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error('Error:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
