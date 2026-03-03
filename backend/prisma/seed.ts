/**
 * Seed script — creates project records in the database.
 * All Jira data (issues, metrics, simulation) is fetched live from the API
 * on every dashboard access, so only the Project config is seeded here.
 *
 * Run:  npx ts-node prisma/seed.ts
 *
 * Required env vars (read from .env in repo root automatically via dotenv):
 *   DATABASE_URL
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

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
                'Concluído', 'Concluded', 'Done',
                'Pendente de publicação', 'Pendente publicação',
                'Pending Publication', 'Pending Publication PRD',
            ],
            inProgress: [
                'Em Andamento', 'In Progress', 'Pendente teste',
                'Pending Test', 'TEST PENDING', 'Em Teste', 'TEST',
                'Acompanhamento', 'Liberado para Homologação',
                'AGUARDANDO CODEREVIEW', 'Aguardando MR',
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

    console.log('🌱 Seeding projects…');

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
            },
        });
        console.log(`   ✓ ${project.name} (${project.id})`);
    }

    console.log('✅ Seed complete! Jira data will be fetched live on dashboard access.');
    await prisma.$disconnect();
    await pool.end();
}

main().catch((e) => {
    console.error('❌ Seed error:', e.message || e);
    process.exit(1);
});
