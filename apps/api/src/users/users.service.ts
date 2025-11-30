import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByStudentIdHash(studentIdHash: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { studentIdHash },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async createSession(data: Prisma.SessionCreateInput) {
    return this.prisma.session.create({
      data,
    });
  }

  async findSession(jti: string) {
    return this.prisma.session.findUnique({
      where: { jti },
    });
  }

  async revokeSession(jti: string) {
    return this.prisma.session.update({
      where: { jti },
      data: { revoked: true, revokedAt: new Date() },
    });
  }
}
