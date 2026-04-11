import { PartialType } from '@nestjs/swagger';
import { CreateUserVoteKeyDto } from './create-user-vote-key.dto';

export class UpdateUserVoteKeyDto extends PartialType(CreateUserVoteKeyDto) {}
