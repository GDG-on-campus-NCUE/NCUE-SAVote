import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CandidatesService } from './candidates.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UseGuards } from '@nestjs/common';
import { VotesService } from '../votes/votes.service';
import { VotersService } from '../voters/voters.service';

@Controller('elections')
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService,
    private readonly candidatesService: CandidatesService,
    private readonly votesService: VotesService,
    private readonly votersService: VotersService,
  ) {}

  @Post()

  @UseGuards(AdminGuard)
  create(@Body() dto: CreateElectionDto) {
    return this.electionsService.create(dto);
  }

  @Get()
  findAll() {
    return this.electionsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.electionsService.findOne(id);
  }

  @Patch(':id')

  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    return this.electionsService.update(id, dto);
  }

  @Delete(':id')

  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.electionsService.remove(id);
  }

  // Lifecycle: Snapshot the voter tree
  @UseGuards(AdminGuard)
  @Post(':id/snapshot')
  snapshot(@Param('id') electionId: string) {
    return this.votersService.snapshotElection(electionId);
  }

  // Lifecycle: finalize voter list and open voting
  @UseGuards(AdminGuard)
  @Post(':id/finalize')
  finalize(@Param('id') electionId: string) {
    return this.electionsService.finalizeVoterList(electionId);
  }

  // Eligible Voters Endpoints
  @UseGuards(AdminGuard)
  @Post(':id/eligible-voters/import')
  importEligibleVoters(
    @Param('id') electionId: string,
    @Body() dto: ImportEligibleVotersDto
  ) {
    return this.electionsService.importEligibleVoters(electionId, dto);
  }

  @UseGuards(AdminGuard)
  @Get(':id/eligible-voters')
  listEligibleVoters(@Param('id') electionId: string) {
    return this.electionsService.listEligibleVoters(electionId);
  }

  // Admin monitoring summary (after election closed)
  @UseGuards(AdminGuard)
  @Get(':id/admin-summary')
  async getAdminSummary(@Param('id') electionId: string) {
    const election = await this.electionsService.findOne(electionId);
    const tally = await this.votesService.getTally(electionId);
    const totalVotes = Object.values(tally).reduce((sum, v) => sum + (v as number), 0);

    return {
      election,
      status: election.status,
      totalVotes,
      tally,
    };
  }

  // Candidate Endpoints
  @UseGuards(AdminGuard)
  @Post(':id/candidates')
  createCandidate(
    @Param('id') electionId: string,
    @Body() dto: CreateCandidateDto,
  ) {
    return this.candidatesService.create(electionId, dto);
  }

  @Get(':id/candidates')
  findAllCandidates(@Param('id') electionId: string) {
    return this.candidatesService.findAll(electionId);
  }

  @UseGuards(AdminGuard)
  @Patch('candidates/:id')
  updateCandidate(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateDto,
  ) {
    return this.candidatesService.update(id, dto);
  }

  @UseGuards(AdminGuard)
  @Delete('candidates/:id')
  removeCandidate(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
