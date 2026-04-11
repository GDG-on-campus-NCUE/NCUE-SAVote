export class CreateUserVoteKeyDto {
  hashedID: string;
  electionId: string;
  secret: string;
  commitment: string;
}
