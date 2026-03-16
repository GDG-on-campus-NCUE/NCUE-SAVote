import { Test, TestingModule } from '@nestjs/testing';
import { UserVoteKeyController } from './user-vote-key.controller';
import { UserVoteKeyService } from './user-vote-key.service';

describe('UserVoteKeyController', () => {
  let controller: UserVoteKeyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserVoteKeyController],
      providers: [UserVoteKeyService],
    }).compile();

    controller = module.get<UserVoteKeyController>(UserVoteKeyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
