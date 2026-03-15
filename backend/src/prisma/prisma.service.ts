import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private client: InstanceType<typeof PrismaClient>;

  // Expose all prisma model accessors at the top level so existing code
  // (this.prisma.project, this.prisma.user, etc.) keeps working.
  public project: InstanceType<typeof PrismaClient>['project'];
  public snapshot: InstanceType<typeof PrismaClient>['snapshot'];
  public company: InstanceType<typeof PrismaClient>['company'];
  public user: InstanceType<typeof PrismaClient>['user'];
  public verificationCode: InstanceType<
    typeof PrismaClient
  >['verificationCode'];

  constructor(configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    this.pool = new Pool({ connectionString });
    const adapter = new PrismaPg(this.pool);
    this.client = new PrismaClient({ adapter });

    // Bind model accessors so services can use this.prisma.project etc.
    this.project = this.client.project;
    this.snapshot = this.client.snapshot;
    this.company = this.client.company;
    this.user = this.client.user;
    this.verificationCode = this.client.verificationCode;
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
    await this.pool.end();
  }
}
