import { IsString, IsNotEmpty } from 'class-validator';

export class ImportEligibleVotersDto {
  @IsString()
  @IsNotEmpty()
  csv: string; // CSV content as string
}
