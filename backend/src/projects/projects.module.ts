import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { MetricsService } from './metrics/metrics.service';
import { MonteCarloService } from './monte-carlo/monte-carlo.service';
import { BaselineService } from './baseline/baseline.service';
import { JiraModule } from '../jira/jira.module';

@Module({
  imports: [JiraModule],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    MetricsService,
    MonteCarloService,
    BaselineService,
  ],
})
export class ProjectsModule { }
