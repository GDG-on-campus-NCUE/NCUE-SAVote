import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ElectionsService } from './elections.service';
import { CandidatesService } from './candidates.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';

import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VotesService } from '../votes/votes.service';
import { VotersService } from '../voters/voters.service';
import { MerkleTreeService } from '../merkle/merkle.service';

@Controller('elections')
export class ElectionsController {
  constructor(
    private readonly electionsService: ElectionsService,
    private readonly candidatesService: CandidatesService,
    private readonly votesService: VotesService,
    private readonly votersService: VotersService,
    private readonly merkleTreeService: MerkleTreeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
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

  @Get(':id/proof')
  getMerkleProof(
    @Param('id') electionId: string,
    @Query('commitment') commitment: string,
  ) {
    return this.merkleTreeService.getProof(electionId, commitment);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateElectionDto) {
    return this.electionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.electionsService.remove(id);
  }

  // Lifecycle: Snapshot the voter tree
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/snapshot')
  snapshot(@Param('id') electionId: string) {
    return this.votersService.snapshotElection(electionId);
  }

  // Lifecycle: finalize voter list and open voting
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/finalize')
  finalize(@Param('id') electionId: string) {
    return this.electionsService.finalizeVoterList(electionId);
  }

  // Eligible Voters Endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/eligible-voters/import')
  importEligibleVoters(
    @Param('id') electionId: string,
    @Body() dto: ImportEligibleVotersDto,
  ) {
    return this.electionsService.importEligibleVoters(electionId, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id/eligible-voters')
  listEligibleVoters(@Param('id') electionId: string) {
    return this.electionsService.listEligibleVoters(electionId);
  }

  // Admin monitoring summary (after election closed)
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id/admin-summary')
  async getAdminSummary(@Param('id') electionId: string) {
    const election = await this.electionsService.findOne(electionId);
    const summary = await this.votesService.getTally(electionId);
    
    return {
      election,
      status: election.status,
      totalVotes: summary.totalVotes,
      tally: summary.tally,
      result: summary.result,
    };
  }


  // Candidate Endpoints
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/candidates')
  @UseInterceptors(
    FileInterceptor('photo', {
      storage: diskStorage({
        destination: './uploads/candidates',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          return cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  createCandidate(
    @Param('id') electionId: string,
    @Body() dto: CreateCandidateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      // Assuming server runs on port 3000 or accessed via Nginx.
      // Storing relative path. Client should prepend base URL if needed.
      dto.photoUrl = `/uploads/candidates/${file.filename}`;
    }
    return this.candidatesService.create(electionId, dto);
  }

  @Get(':id/candidates')
  findAllCandidates(@Param('id') electionId: string) {
    return this.candidatesService.findAll(electionId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('candidates/:id')
  updateCandidate(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.candidatesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('candidates/:id')
  removeCandidate(@Param('id') id: string) {
    return this.candidatesService.remove(id);
  }
}
