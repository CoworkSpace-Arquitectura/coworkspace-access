import { Module } from '@nestjs/common';
import { CredentialsController } from './credentials.controller.js';
import { CredentialsService } from './credentials.service.js';
import { MembershipClient } from './membership.client.js';

@Module({
  controllers: [CredentialsController],
  providers: [CredentialsService, MembershipClient],
  exports: [CredentialsService],
})
export class CredentialsModule {}