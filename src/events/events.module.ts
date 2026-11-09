import { Module } from '@nestjs/common';
import { CredentialsModule } from '../credentials/credentials.module.js';
import { MembershipEventsListener } from './membership-events.listener.js';

@Module({
  imports: [CredentialsModule],
  providers: [MembershipEventsListener],
})
export class EventsModule {}