import { IsUUID } from 'class-validator';

export class IssueCredentialDto {
  @IsUUID()
  memberId!: string;
}