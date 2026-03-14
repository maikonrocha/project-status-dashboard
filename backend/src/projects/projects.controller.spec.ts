import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

const mockProjectsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStatus: jest.fn(),
};

const REQ = { user: { id: 'user-uuid', companyId: 'company-uuid', role: 'OWNER' } };

describe('ProjectsController', () => {
  let controller: ProjectsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compile();

    controller = module.get<ProjectsController>(ProjectsController);
  });

  describe('create', () => {
    it('delegates to projectsService.create with companyId from request', async () => {
      const dto = { epicId: 'TST-1', name: 'Proj', squadName: 'A', teamSize: 5 } as any;
      mockProjectsService.create.mockResolvedValueOnce({ id: 'proj-uuid', ...dto });

      const result = await controller.create(REQ as any, dto);

      expect(mockProjectsService.create).toHaveBeenCalledWith(dto, REQ.user.companyId);
      expect(result).toHaveProperty('id', 'proj-uuid');
    });
  });

  describe('findAll', () => {
    it('delegates to projectsService.findAll with companyId', async () => {
      mockProjectsService.findAll.mockResolvedValueOnce([]);

      const result = await controller.findAll(REQ as any);

      expect(mockProjectsService.findAll).toHaveBeenCalledWith(REQ.user.companyId);
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('delegates to projectsService.findOne with id and companyId', async () => {
      const project = { id: 'proj-uuid', name: 'Proj' };
      mockProjectsService.findOne.mockResolvedValueOnce(project);

      const result = await controller.findOne(REQ as any, 'proj-uuid');

      expect(mockProjectsService.findOne).toHaveBeenCalledWith('proj-uuid', REQ.user.companyId);
      expect(result).toBe(project);
    });
  });

  describe('update', () => {
    it('delegates to projectsService.update with id, dto, and companyId', async () => {
      const dto = { name: 'Updated' } as any;
      const updated = { id: 'proj-uuid', name: 'Updated' };
      mockProjectsService.update.mockResolvedValueOnce(updated);

      const result = await controller.update(REQ as any, 'proj-uuid', dto);

      expect(mockProjectsService.update).toHaveBeenCalledWith(
        'proj-uuid', dto, REQ.user.companyId,
      );
      expect(result).toBe(updated);
    });
  });

  describe('remove', () => {
    it('delegates to projectsService.remove with id and companyId', async () => {
      const deleted = { id: 'proj-uuid' };
      mockProjectsService.remove.mockResolvedValueOnce(deleted);

      const result = await controller.remove(REQ as any, 'proj-uuid');

      expect(mockProjectsService.remove).toHaveBeenCalledWith('proj-uuid', REQ.user.companyId);
      expect(result).toBe(deleted);
    });
  });

  describe('getStatus', () => {
    it('delegates to projectsService.getStatus with id and companyId', async () => {
      const status = { project: { id: 'proj-uuid' }, kpis: {}, chartData: {}, tables: {} };
      mockProjectsService.getStatus.mockResolvedValueOnce(status);

      const result = await controller.getStatus(REQ as any, 'proj-uuid');

      expect(mockProjectsService.getStatus).toHaveBeenCalledWith('proj-uuid', REQ.user.companyId);
      expect(result).toBe(status);
    });
  });
});
