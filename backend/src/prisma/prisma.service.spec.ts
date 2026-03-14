import { ConfigService } from '@nestjs/config';

// ─── Mock all native DB dependencies before importing PrismaService ───────────

const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockDisconnect = jest.fn().mockResolvedValue(undefined);
const mockPoolEnd = jest.fn().mockResolvedValue(undefined);

const mockPrismaClientInstance = {
  $connect: mockConnect,
  $disconnect: mockDisconnect,
  project: {},
  snapshot: {},
  company: {},
  user: {},
  verificationCode: {},
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({ end: mockPoolEnd })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => mockPrismaClientInstance),
}));

import { PrismaService } from './prisma.service';

function makeConfigService(dbUrl = 'postgresql://test'): ConfigService {
  return { get: (_key: string) => dbUrl } as unknown as ConfigService;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PrismaService(makeConfigService());
  });

  describe('constructor', () => {
    it('instantiates without throwing', () => {
      expect(service).toBeDefined();
    });

    it('exposes project model accessor', () => {
      expect(service.project).toBeDefined();
    });

    it('exposes user model accessor', () => {
      expect(service.user).toBeDefined();
    });

    it('exposes company model accessor', () => {
      expect(service.company).toBeDefined();
    });

    it('exposes verificationCode model accessor', () => {
      expect(service.verificationCode).toBeDefined();
    });

    it('exposes snapshot model accessor', () => {
      expect(service.snapshot).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('calls $connect on the Prisma client', async () => {
      await service.onModuleInit();
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });
  });

  describe('onModuleDestroy', () => {
    it('calls $disconnect and pool.end', async () => {
      await service.onModuleDestroy();
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
      expect(mockPoolEnd).toHaveBeenCalledTimes(1);
    });
  });
});
