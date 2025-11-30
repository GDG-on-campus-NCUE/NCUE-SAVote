import { IsUUID } from 'class-validator';

export class ImportVotersDto {
  @IsUUID()
  electionId!: string;
}
