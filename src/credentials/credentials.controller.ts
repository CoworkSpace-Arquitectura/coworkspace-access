import { Body, Controller, Get, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { CredentialsService } from './credentials.service.js';
import { IssueCredentialDto } from './dto/issue-credential.dto.js';

@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  issue(@Body() dto: IssueCredentialDto) {
    return this.credentialsService.issue(dto.memberId);
  }

  @Get()
  findByMember(@Query('memberId', ParseUUIDPipe) memberId: string) {
    return this.credentialsService.findByMember(memberId);
  }
}