import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { MembershipClient } from './membership.client.js';

const CREDENTIAL_TTL_HOURS = Number(process.env.CREDENTIAL_TTL_HOURS ?? 12);

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membership: MembershipClient,
  ) {}

  async issue(memberId: string) {
    await this.membership.assertActiveMembership(memberId);

    await this.prisma.accessCredential.updateMany({
      where: { memberId, isActive: true },
      data: { isActive: false, revokedReason: 'REPLACED' },
    });

    const token = randomBytes(32).toString('base64url');
    const credential = await this.prisma.accessCredential.create({
      data: {
        memberId,
        credentialHash: hashToken(token),
        expiresAt: new Date(Date.now() + CREDENTIAL_TTL_HOURS * 60 * 60 * 1000),
      },
    });

    return { credentialId: credential.id, memberId, token, expiresAt: credential.expiresAt };
  }

  findByMember(memberId: string) {
    return this.prisma.accessCredential.findMany({
      where: { memberId },
      orderBy: { issuedAt: 'desc' },
      select: { id: true, memberId: true, isActive: true, issuedAt: true, expiresAt: true, revokedReason: true },
    });
  }

  async revokeAllForMember(memberId: string, reason: string) {
    const { count } = await this.prisma.accessCredential.updateMany({
      where: { memberId, isActive: true },
      data: { isActive: false, revokedReason: reason },
    });
    this.logger.log(`Credenciales revocadas para ${memberId}: ${count} (${reason})`);
    return count;
  }
}