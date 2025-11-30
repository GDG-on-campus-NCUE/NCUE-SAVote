import { IsUUID } from 'class-validator';

export class VerifyEligibilityDto {
  @IsUUID()
  electionId!: string;
}
