import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CandidatesService } from './candidates.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { VotesService } from '../votes/votes.service';

@Controller('elections')
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService,
    private readonly candidatesService: CandidatesService,
    private readonly votesService: VotesService,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() createElectionDto: CreateElectionDto) {
    return this.electionsService.create(createElectionDto);
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
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(
    @Param('id') id: string,
    @Body() updateElectionDto: UpdateElectionDto,
  ) {
    return this.electionsService.update(id, updateElectionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.electionsService.remove(id);
  }

  // --- Candidate Management ---
  @Post(':id/candidates')
  @UseGuards(JwtAuthGuard, AdminGuard)
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

  @Patch('candidates/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateCandidate(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidatesService.update(id, dto);
  }

  @Delete('candidates/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  removeCandidate(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }

  // --- Voting Results (Time-restricted in Service) ---
  @Get(':id/admin-summary')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminSummary(@Param('id') id: string) {
    return this.electionsService.getAdminSummary(id);
  }

  // --- Voter Management ---
  @Post(':id/voters/import')
  @UseGuards(JwtAuthGuard, AdminGuard)
  importVoters(
    @Param('id') id: string,
    @Body() dto: ImportEligibleVotersDto,
  ) {
    return this.electionsService.importEligibleVoters(id, dto);
  }

  @Get(':id/voters')
  @UseGuards(JwtAuthGuard, AdminGuard)
  listVoters(@Param('id') id: string) {
    return this.electionsService.listEligibleVoters(id);
  }

  @Get(':id/results') 
  async getPublicResults(@Param('id') id: string) {
    return this.electionsService.getPublicResults(id);
  }
}
