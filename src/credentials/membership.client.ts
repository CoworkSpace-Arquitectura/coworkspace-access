import { ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class MembershipClient {
  private readonly logger = new Logger(MembershipClient.name);
  private readonly baseUrl = process.env.MEMBERSHIP_URL ?? 'http://localhost:3002';

  async assertActiveMembership(memberId: string) {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/subscriptions/member/${memberId}/active`, {
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      this.logger.error(`Membership no respondió: ${(error as Error).message}`);
      throw new ServiceUnavailableException('No se pudo verificar la membresía en este momento');
    }

    if (response.status === 404) {
      throw new ForbiddenException('El miembro no tiene una membresía activa');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException(`Membership respondió con estado ${response.status}`);
    }
  }
}