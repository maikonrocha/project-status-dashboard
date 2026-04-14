import {
  IsString,
  IsInt,
  IsDateString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class StatusConfigDto {
  @IsArray()
  @IsString({ each: true })
  concluded!: string[];

  @IsArray()
  @IsString({ each: true })
  inProgress!: string[];
}

export class CreateProjectDto {
  @IsString()
  epicId!: string;

  @IsString()
  name!: string;

  @IsString()
  squadName!: string;

  @IsInt()
  @Min(1)
  teamSize!: number;

  @IsDateString()
  beginDate!: Date;

  @IsString()
  jiraBacklogFilterId!: string;

  @IsString()
  jiraThroughputFilterId!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StatusConfigDto)
  statusConfig?: StatusConfigDto;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  epicId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  squadName?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  teamSize?: number;

  @IsOptional()
  @IsDateString()
  beginDate?: Date;

  @IsOptional()
  @IsString()
  jiraBacklogFilterId?: string;

  @IsOptional()
  @IsString()
  jiraThroughputFilterId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => StatusConfigDto)
  statusConfig?: StatusConfigDto;
}
