import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserVoteKeyService } from './user-vote-key.service';
import { CreateUserVoteKeyDto } from './dto/create-user-vote-key.dto';
import { UpdateUserVoteKeyDto } from './dto/update-user-vote-key.dto';

@Controller('user-vote-key')
export class UserVoteKeyController {
  constructor(private readonly userVoteKeyService: UserVoteKeyService) {}

  
}
