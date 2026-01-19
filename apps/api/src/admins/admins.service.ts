import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole, EnrollmentStatus } from '@savote/shared-types';

@Injectable()
export class AdminsService {
  constructor(private prisma: PrismaService) {}

  async create(createAdminDto: CreateAdminDto) {
    const { username, password, name } = createAdminDto;

    // Check if username exists
    const existingAdmin = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate dummy studentIdHash for admin
    const studentIdHash = crypto
      .createHash('sha256')
      .update(`admin_${username}`)
      .digest('hex');

    // Create admin user
    const admin = await this.prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: UserRole.ADMIN,
        studentIdHash,
        class: 'ADMIN', // Dummy class
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });

    return admin;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: UserRole.ADMIN },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const admin = await this.prisma.user.findUnique({
      where: { id, role: UserRole.ADMIN },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastLoginIp: true,
        createdAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto) {
    const { password, ...otherData } = updateAdminDto;

    // Ensure admin exists
    await this.findOne(id);

    const data: any = { ...otherData };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        lastLoginIp: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Ensure exists

    return this.prisma.user.delete({
      where: { id },
    });
  }
}
