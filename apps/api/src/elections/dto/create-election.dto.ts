import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ElectionStatus } from '@savote/shared-types';

export class CreateElectionDto {
    @IsString()
    name: string;

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
