import { IsString, IsOptional } from 'class-validator';

export class SamlCallbackDto {
  @IsString()
  SAMLResponse: string;

  @IsOptional()
  @IsString()
  RelayState?: string;
}
