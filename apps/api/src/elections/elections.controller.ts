import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { ElectionsService } from './elections.service';
import { CreateElectionDto } from './dto/create-election.dto';
import { UpdateElectionDto } from './dto/update-election.dto';

import { ImportEligibleVotersDto } from './dto/import-eligible-voters.dto';
import { AdminGuard } from '../auth/guards/admin.guard';
import { UseGuards } from '@nestjs/common';

@Controller('elections')
export class ElectionsController {
  constructor(private readonly electionsService: ElectionsService) {}

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
}
