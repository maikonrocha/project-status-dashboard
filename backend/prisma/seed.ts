/**
 * Seed script — creates a default owner, company, and project records.
 *
 * Run:  npx ts-node prisma/seed.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

// ── Default company + owner ─────────────────────────────────────────────────
const DEFAULT_OWNER = {
  email: 'admin@dashboard.dev',
  name: 'Admin',
  password: 'admin123',
};

const DEFAULT_COMPANY = {
  name: 'Demo Company',
};

// ── Project configs ──────────────────────────────────────────────────────────
const PROJECTS = [
  {
    epicId: 'MKT-3068',
    name: 'Next.js (Marketing)',
    squadName: 'Squad Marketing',
    teamSize: 5,
    beginDate: new Date('2025-10-24'),
    jiraBacklogFilterId: '10001',
    jiraThroughputFilterId: '10002',
    statusConfig: {
      concluded: [
        'Concluído',
        'Concluded',
        'Done',
        'Pendente de publicação',
        'Pendente publicação',
        'Pending Publication',
        'Pending Publication PRD',
      ],
      inProgress: [
        'Em Andamento',
        'In Progress',
        'Pendente teste',
        'Pending Test',
        'TEST PENDING',
        'Em Teste',
        'TEST',
        'Acompanhamento',
        'Liberado para Homologação',
        'AGUARDANDO CODEREVIEW',
        'Aguardando MR',
      ],
    },
  },
];

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/dashboard_v3';

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  console.warn('🌱 Seeding database…');

  // 1. Create or find company
  let company = await prisma.company.findFirst({
    where: { name: DEFAULT_COMPANY.name },
  });

  if (!company) {
    company = await prisma.company.create({
      data: { name: DEFAULT_COMPANY.name },
    });
    console.warn(`   ✓ Company created: ${company.name} (${company.id})`);
  } else {
    console.warn(`   ✓ Company exists: ${company.name} (${company.id})`);
  }

  // 2. Create or find owner user
  let owner = await prisma.user.findUnique({
    where: { email: DEFAULT_OWNER.email },
  });

  if (!owner) {
    const passwordHash = await bcrypt.hash(DEFAULT_OWNER.password, 12);
    owner = await prisma.user.create({
      data: {
        email: DEFAULT_OWNER.email,
        name: DEFAULT_OWNER.name,
        passwordHash,
        role: 'OWNER',
        isVerified: true,
        companyId: company.id,
      },
    });
    console.warn(
      `   ✓ Owner created: ${owner.email} (password: ${DEFAULT_OWNER.password})`,
    );
  } else {
    console.warn(`   ✓ Owner exists: ${owner.email}`);
  }

  // 3. Seed projects
  for (const config of PROJECTS) {
    const project = await prisma.project.upsert({
      where: { epicId: config.epicId },
      update: {
        name: config.name,
        squadName: config.squadName,
        teamSize: config.teamSize,
        beginDate: config.beginDate,
        jiraBacklogFilterId: config.jiraBacklogFilterId,
        jiraThroughputFilterId: config.jiraThroughputFilterId,
        statusConfig: config.statusConfig,
        companyId: company.id,
      },
      create: {
        epicId: config.epicId,
        name: config.name,
        squadName: config.squadName,
        teamSize: config.teamSize,
        beginDate: config.beginDate,
        jiraBacklogFilterId: config.jiraBacklogFilterId,
        jiraThroughputFilterId: config.jiraThroughputFilterId,
        statusConfig: config.statusConfig,
        companyId: company.id,
      },
    });
    console.warn(`   ✓ Project: ${project.name} (${project.id})`);
  }

  console.warn('');
  console.warn('✅ Seed complete!');
  console.warn(`   Login: ${DEFAULT_OWNER.email} / ${DEFAULT_OWNER.password}`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  console.error('❌ Seed error:', message);
  process.exit(1);
});
