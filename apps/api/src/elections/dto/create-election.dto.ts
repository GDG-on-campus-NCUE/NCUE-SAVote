import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ElectionStatus, ElectionType } from '@savote/shared-types';

export class CreateElectionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ElectionType)
  type: ElectionType;

  @IsOptional()
  @IsObject()
  config?: any;

  @IsOptional()
  @IsString()
  merkleRootHash?: string;

  @IsOptional()
  @IsEnum(ElectionStatus)
  status?: ElectionStatus;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;
}
