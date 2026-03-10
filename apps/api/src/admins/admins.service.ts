import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@savote/shared-types';
import { normalizeSub } from '../utils/auth-utils';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { synologySub: string; name: string; role: UserRole }) {
    // Normalize sub (e.g. "NCUESA\S123" -> "S123")
    const synologySub = normalizeSub(data.synologySub);

    const existing = await this.prisma.adminPermission.findUnique({
      where: { synologySub },
    });

    if (existing) {
      throw new ConflictException('Admin with this Synology ID already exists');
    }

    return this.prisma.adminPermission.create({
      data: {
        synologySub,
        name: data.name,
        role: data.role as any,
      },
    });
  }

  async findAll() {
    return this.prisma.adminPermission.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRole(id: string, role: UserRole) {
    const permission = await this.prisma.adminPermission.findUnique({
      where: { id },
    });

    if (!permission) throw new NotFoundException('Permission record not found');

    // Update permission table
    const updated = await this.prisma.adminPermission.update({
      where: { id },
      data: { role: role as any },
    });

    // Sync to User table if they have logged in before
    await this.prisma.user.updateMany({
      where: { synologySub: permission.synologySub },
      data: { role: role as any },
    });

    return updated;
  }

  async remove(id: string) {
    const permission = await this.prisma.adminPermission.findUnique({
      where: { id },
    });

    if (!permission) throw new NotFoundException('Permission record not found');

    // Remove from permission table
    await this.prisma.adminPermission.delete({ where: { id } });

    // Sync to User table: Demote to USER
    await this.prisma.user.updateMany({
      where: { synologySub: permission.synologySub },
      data: { role: UserRole.USER as any },
    });

    return { success: true };
  }
}
