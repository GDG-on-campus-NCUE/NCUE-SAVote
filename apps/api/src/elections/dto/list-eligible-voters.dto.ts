import { IsUUID } from 'class-validator';

export class ListEligibleVotersDto {
  @IsUUID()
  electionId: string;
}
