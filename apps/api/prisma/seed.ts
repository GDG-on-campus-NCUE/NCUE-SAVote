import { PrismaClient, ElectionStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function hashStudentId(studentId: string): string {
  return crypto.createHash('sha256').update(studentId).digest('hex');
}

async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = 10;
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Users
  // Regular User (matches dev login)
  const devStudentId = 'S123456789';
  const devUserHash = hashStudentId(devStudentId);
  
  const devUser = await prisma.user.upsert({
    where: { studentIdHash: devUserHash },
    update: {},
    create: {
      studentIdHash: devUserHash,
      class: 'CS-2025',
      email: 'test@example.com',
    },
  });
  console.log(`👤 Created/Updated Dev User: ${devUser.id}`);

  // Admin User
  const adminStudentId = 'ADMIN001';
  const adminUserHash = hashStudentId(adminStudentId);
    const adminPassword = await hashPassword('admin123'); // Change in production
  
  const adminUser = await prisma.user.upsert({
    where: { studentIdHash: adminUserHash },
    update: { 
      role: 'ADMIN',
      username: 'admin',
      password: adminPassword,
    },
    create: {
      studentIdHash: adminUserHash,
      class: 'ADMIN',
      email: 'admin@savote.org',
      role: 'ADMIN',
      username: 'admin',
      password: adminPassword,
    },
  });
  console.log(`🛡️ Created/Updated Admin User: ${adminUser.id} (Role: ADMIN)`);

  // 2. Create Election
  const election = await prisma.election.create({
    data: {
      name: '2025 Student Council President Election',
      status: ElectionStatus.VOTING_OPEN,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      candidates: {
        create: [
          {
            name: 'Alice Chen',
            bio: 'Dedicated to improving student welfare and campus facilities. "Vote for Change!"',
            photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
          },
          {
            name: 'Bob Smith',
            bio: 'Focusing on academic resources and club funding. "Building a Better Future Together."',
            photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
          },
          {
            name: 'Charlie Kim',
            bio: 'Advocating for more social events and mental health support. "Your Voice, My Mission."',
            photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie',
          },
        ],
      },
    },
  });
  console.log(`🗳️ Created Election: ${election.name} (${election.id})`);

  // 3. Add Eligible Voters
  // Add Dev User as eligible voter
  await prisma.eligibleVoter.create({
    data: {
      studentId: devStudentId,
      class: 'CS-2025',
      electionId: election.id,
    },
  });
  console.log(`✅ Added ${devStudentId} as eligible voter for election ${election.id}`);

  // Add Admin User as eligible voter (optional)
  await prisma.eligibleVoter.create({
    data: {
      studentId: adminStudentId,
      class: 'ADMIN',
      electionId: election.id,
    },
  });

  console.log('🌱 Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
