import { IsString, IsOptional, IsUrl, IsUUID } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  photoUrl?: string;
}
