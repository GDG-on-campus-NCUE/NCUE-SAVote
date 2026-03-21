import { Controller, Post, Body, Get, Param, Req, UseGuards } from '@nestjs/common';
import { VotesService } from './votes.service';
import { SubmitVoteDto } from './dto/submit-vote.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@ApiTags('votes')
@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) { }

  @Post('submit')
  //@UseGuards(JwtAuthGuard) // 必須加上 Guard 才能拿到 user
  @ApiOperation({ summary: 'Submit a ZK vote' })
  @ApiResponse({ status: 201, description: 'Vote cast successfully' })
  @ApiResponse({ status: 400, description: 'Invalid proof or input' })
  @ApiResponse({ status: 409, description: 'Double voting detected (Handled by Silent Return)' })
  async submitVote(
    @Body() submitVoteDto: SubmitVoteDto
  ) {
    //const userId = req.user.id;

    return await this.votesService.submitVote(submitVoteDto);
  }


  @Get(':electionId/tally')
  @ApiOperation({ summary: 'Get election tally' })
  getTally(@Param('electionId') electionId: string) {
    return this.votesService.getTally(electionId);
  }


  /*@Get(':electionId/logs')
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
  }*/

  // @Get('hello/:electionId')
  // @UseGuards(JwtAuthGuard) // 必須登入
  // async serverHello(@Req() req: any, @Param('electionId') electionId: string) {
  //   const userId = req.user.id; // 從 JWT 拿到 userId

  //   // 呼叫 Service 執行邏輯
  //   //return this.votesService.getVoterCredential(userId, electionId);
  // }
}
