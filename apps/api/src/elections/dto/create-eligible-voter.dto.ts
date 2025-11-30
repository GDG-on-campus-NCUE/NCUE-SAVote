import { IsString, IsUUID } from 'class-validator';

export class CreateEligibleVoterDto {
  @IsString()
  studentId: string;

  @IsString()
  class: string;

  @IsUUID()
  electionId: string;
}
