import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import type { Request } from 'express';
import { JWTPayload, ApiResponse, UserProfile, UserRole, EnrollmentStatus } from '@savote/shared-types';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: Request): Promise<ApiResponse<UserProfile>> {
    const payload = req.user as JWTPayload;
    const user = await this.usersService.findByStudentIdHash(payload.studentIdHash);

    if (!user) {
      return {
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      };
    }

    return {
      success: true,
      data: {
        id: user.id,
        studentIdHash: user.studentIdHash,
        class: user.class,
        email: user.email,
        name: user.name,
        enrollmentStatus: user.enrollmentStatus as unknown as EnrollmentStatus,
        role: user.role as UserRole,
      },
    };
  }
}
