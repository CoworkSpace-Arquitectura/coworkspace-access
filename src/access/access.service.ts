import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashToken } from '../credentials/credentials.service.js';
import { ValidateAccessDto } from './dto/validate-access.dto.js';

@Injectable()
export class AccessService {
  constructor(private readonly prisma: PrismaService) {}

  async validate(dto: ValidateAccessDto) {
    const credential = await this.prisma.accessCredential.findUnique({
      where: { credentialHash: hashToken(dto.token) },
    });

    let granted = false;
    let reason: string;
    if (!credential) {
      reason = 'CREDENTIAL_NOT_FOUND';
    } else if (!credential.isActive) {
      reason = 'CREDENTIAL_REVOKED';
    } else if (credential.expiresAt <= new Date()) {
      reason = 'CREDENTIAL_EXPIRED';
    } else {
      granted = true;
      reason = 'OK';
    }

    await this.prisma.accessLog.create({
      data: { memberId: credential?.memberId ?? null, locationId: dto.locationId, granted, reason },
    });

    return { granted, reason, memberId: credential?.memberId ?? null };
  }

  findLogs(memberId?: string, locationId?: string) {
    return this.prisma.accessLog.findMany({
      where: { memberId, locationId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  }
}