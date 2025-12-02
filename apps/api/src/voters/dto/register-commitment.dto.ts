import { IsString, IsUUID, Length } from 'class-validator';

export class RegisterCommitmentDto {
  @IsUUID()
  electionId!: string;

  @IsString()
  @Length(32, 128)
  commitment!: string;
}
