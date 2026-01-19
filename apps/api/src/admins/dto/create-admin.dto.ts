import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAdminDto {
  @ApiProperty({ description: 'Admin username for login' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @ApiProperty({ description: 'Admin password' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ description: 'Admin display name' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;
}
