import { PartialType } from '@nestjs/mapped-types';
import { CreateElectionDto } from './create-election.dto';
import { IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { ElectionStatus } from '@savote/shared-types';

export class UpdateElectionDto extends PartialType(CreateElectionDto) {
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
