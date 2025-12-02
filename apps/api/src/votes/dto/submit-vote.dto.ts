import { IsArray, IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitVoteDto {
  @ApiProperty({ description: 'The ID of the election' })
  @IsString()
  @IsNotEmpty()
  electionId: string;

  @ApiProperty({ description: 'The ID of the candidate voted for' })
  @IsString()
  @IsNotEmpty()
  vote: string;

  @ApiProperty({ description: 'The ZK proof object' })
  @IsObject()
  @IsNotEmpty()
  proof: any;

  @ApiProperty({ description: 'The public signals (nullifierHash, voteHash, root, electionId, vote)' })
  @IsArray()
  @IsNotEmpty()
  publicSignals: string[];
}
