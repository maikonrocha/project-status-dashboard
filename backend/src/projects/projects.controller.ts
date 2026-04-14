import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Roles } from '../auth/roles.decorator';
import type { RequestWithUser } from '../auth/jwt.strategy';

@ApiBearerAuth()
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @Roles('OWNER')
  create(
    @Request() req: RequestWithUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(createProjectDto, req.user.companyId);
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.projectsService.findAll(req.user.companyId);
  }

  @Get(':id')
  findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectsService.findOne(id, req.user.companyId);
  }

  @Put(':id')
  @Roles('OWNER')
  update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(
      id,
      updateProjectDto,
      req.user.companyId,
    );
  }

  @Delete(':id')
  @Roles('OWNER')
  remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectsService.remove(id, req.user.companyId);
  }

  @Get(':id/status')
  getStatus(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.projectsService.getStatus(id, req.user.companyId);
  }
}
