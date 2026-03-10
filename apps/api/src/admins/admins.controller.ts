import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  SetMetadata,
  Put,
} from '@nestjs/common';
import { AdminsService } from './admins.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole, ApiResponse } from '@savote/shared-types';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminsController {
  constructor(private readonly adminsService: AdminsService) {}

  @Get('settings/oidc')
  @Roles(UserRole.SUPER_ADMIN)
  async getOidcSettings(): Promise<ApiResponse<any>> {
    const data = await this.adminsService.getOidcSettings();
    return { success: true, data };
  }

  @Put('settings/oidc')
  @Roles(UserRole.SUPER_ADMIN)
  async updateOidcSettings(
    @Body() settings: Record<string, string>,
  ): Promise<ApiResponse<any>> {
    const data = await this.adminsService.updateOidcSettings(settings);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async create(
    @Body() createDto: { synologySub: string; name: string; role: UserRole },
  ): Promise<ApiResponse<any>> {
    const data = await this.adminsService.create(createDto);
    return { success: true, data };
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  async findAll(): Promise<ApiResponse<any>> {
    const data = await this.adminsService.findAll();
    return { success: true, data };
  }

  @Patch(':id/role')
  @Roles(UserRole.SUPER_ADMIN)
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: UserRole,
  ): Promise<ApiResponse<any>> {
    const data = await this.adminsService.updateRole(id, role);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.adminsService.remove(id);
    return { success: true };
  }
}
