import { Test, TestingModule } from '@nestjs/testing';
import { UserVoteKeyService } from './user-vote-key.service';

describe('UserVoteKeyService', () => {
  let service: UserVoteKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserVoteKeyService],
    }).compile();

    service = module.get<UserVoteKeyService>(UserVoteKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
