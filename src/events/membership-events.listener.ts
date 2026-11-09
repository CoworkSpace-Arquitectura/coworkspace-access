import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';
import { CredentialsService } from '../credentials/credentials.service.js';

interface MembershipExpiredEvent {
  event: string;
  data: { memberId: string; reason: string };
}

@Injectable()
export class MembershipEventsListener implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MembershipEventsListener.name);
  private subscriber?: Redis;

  constructor(private readonly credentials: CredentialsService) {}

  onModuleInit() {
    if (!process.env.REDIS_URL) {
      this.logger.warn('REDIS_URL no está configurado: no se escucharán eventos');
      return;
    }
    this.subscriber = new Redis(process.env.REDIS_URL);
    this.subscriber.on('message', (channel: string, message: string) => {
      void this.handle(channel, message);
    });
    this.subscriber
      .subscribe('membership.expired')
      .then(() => this.logger.log('Escuchando el evento membership.expired'))
      .catch((error: Error) => this.logger.error(`No se pudo suscribir: ${error.message}`));
  }

  private async handle(channel: string, message: string) {
    try {
      const event = JSON.parse(message) as MembershipExpiredEvent;
      await this.credentials.revokeAllForMember(event.data.memberId, `MEMBERSHIP_${event.data.reason}`);
    } catch (error) {
      this.logger.error(`Error procesando ${channel}: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.subscriber?.quit();
  }
}