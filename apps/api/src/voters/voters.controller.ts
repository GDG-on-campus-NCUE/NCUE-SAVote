import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ApiResponse, VoterEligibilityResponse, JWTPayload } from '@savote/shared-types';
import type { Express, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { VotersService, ImportVotersResult } from './voters.service';
import { ImportVotersDto } from './dto/import-voters.dto';
import { VerifyEligibilityDto } from './dto/verify-eligibility.dto';

@Controller('voters')
export class VotersController {
  constructor(private readonly votersService: VotersService) {}

  @Post('import')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importVoters(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportVotersDto,
  ): Promise<ApiResponse<ImportVotersResult>> {
    if (!file || !file.buffer?.length) {
      throw new BadRequestException('CSV_FILE_REQUIRED');
    }

    const result = await this.votersService.importVoters(dto.electionId, file.buffer);
    return {
      success: true,
      data: result,
    };
  }

  @Post('verify-eligibility')
  @UseGuards(JwtAuthGuard)
  async verifyEligibility(
    @Body() dto: VerifyEligibilityDto,
    @Req() req: Request,
  ): Promise<ApiResponse<VoterEligibilityResponse>> {
    const payload = req.user as JWTPayload;
    if (!payload?.studentIdHash) {
      throw new BadRequestException('STUDENT_ID_UNAVAILABLE');
    }

    const result = await this.votersService.verifyEligibility(
      dto.electionId,
      payload.studentIdHash,
      payload.class,
    );

    return {
      success: true,
      data: result,
    };
  }
}
