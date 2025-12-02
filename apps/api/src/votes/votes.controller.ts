import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { VotesService } from './votes.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit a ZK vote' })
  @ApiResponse({ status: 201, description: 'Vote cast successfully' })
  @ApiResponse({ status: 400, description: 'Invalid proof or input' })
  @ApiResponse({ status: 409, description: 'Double voting detected' })
  submitVote(@Body() submitVoteDto: SubmitVoteDto) {
    return this.votesService.submitVote(submitVoteDto);
  }

  @Get(':electionId/tally')
  @ApiOperation({ summary: 'Get election tally' })
  getTally(@Param('electionId') electionId: string) {
    return this.votesService.getTally(electionId);
  }

  @Get(':electionId/logs')
  @ApiOperation({ summary: 'Get audit logs' })
  getAuditLogs(@Param('electionId') electionId: string) {
    return this.votesService.getAuditLogs(electionId);
  }

    @Get(':electionId/check-nullifier/:nullifier')
    @ApiOperation({ summary: 'Check if a nullifier exists for the election' })
    async checkNullifier(
      @Param('electionId') electionId: string,
      @Param('nullifier') nullifier: string,
    ) {
      return this.votesService.checkNullifier(electionId, nullifier);
    }
}
