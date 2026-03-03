import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require('@prisma/client');

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private pool: Pool;
    private client: InstanceType<typeof PrismaClient>;

    // Expose all prisma model accessors at the top level so existing code
    // (this.prisma.project, this.prisma.weeklyMetric, etc.) keeps working.
    public project: InstanceType<typeof PrismaClient>['project'];
    public jiraIssue: InstanceType<typeof PrismaClient>['jiraIssue'];
    public snapshot: InstanceType<typeof PrismaClient>['snapshot'];
    public weeklyMetric: InstanceType<typeof PrismaClient>['weeklyMetric'];
    public simulationRun: InstanceType<typeof PrismaClient>['simulationRun'];

    constructor(configService: ConfigService) {
        const connectionString = configService.get<string>('DATABASE_URL');
        this.pool = new Pool({ connectionString });
        const adapter = new PrismaPg(this.pool);
        this.client = new PrismaClient({ adapter });

        // Bind model accessors so services can use this.prisma.project etc.
        this.project = this.client.project;
        this.jiraIssue = this.client.jiraIssue;
        this.snapshot = this.client.snapshot;
        this.weeklyMetric = this.client.weeklyMetric;
        this.simulationRun = this.client.simulationRun;
    }

    async onModuleInit() {
        await this.client.$connect();
    }

    async onModuleDestroy() {
        await this.client.$disconnect();
        await this.pool.end();
    }
}
