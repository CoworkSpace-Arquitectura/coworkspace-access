import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { CredentialsService, hashToken } from './credentials.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { MembershipClient } from './membership.client.js';

describe('CredentialsService', () => {
  const prisma = {
    accessCredential: { updateMany: vi.fn(), create: vi.fn() },
  };
  const membership = { assertActiveMembership: vi.fn() };
  let service: CredentialsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CredentialsService(
      prisma as unknown as PrismaService,
      membership as unknown as MembershipClient,
    );
  });

  it('emite una credencial y guarda solo el hash del token', async () => {
    membership.assertActiveMembership.mockResolvedValue(undefined);
    prisma.accessCredential.updateMany.mockResolvedValue({ count: 0 });
    prisma.accessCredential.create.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'cred-1', ...data }),
    );

    const result = await service.issue('m-1');

    const createArgs = prisma.accessCredential.create.mock.calls[0][0] as { data: { credentialHash: string } };
    expect(createArgs.data.credentialHash).toBe(hashToken(result.token));
    expect(createArgs.data.credentialHash).not.toBe(result.token);
  });

  it('desactiva las credenciales anteriores al emitir una nueva', async () => {
    membership.assertActiveMembership.mockResolvedValue(undefined);
    prisma.accessCredential.updateMany.mockResolvedValue({ count: 1 });
    prisma.accessCredential.create.mockResolvedValue({ id: 'cred-2', expiresAt: new Date() });

    await service.issue('m-1');

    expect(prisma.accessCredential.updateMany).toHaveBeenCalledWith({
      where: { memberId: 'm-1', isActive: true },
      data: { isActive: false, revokedReason: 'REPLACED' },
    });
  });

  it('no emite credencial si el miembro no tiene membresía activa', async () => {
    membership.assertActiveMembership.mockRejectedValue(new ForbiddenException());

    await expect(service.issue('m-1')).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.accessCredential.create).not.toHaveBeenCalled();
  });

  it('revoca todas las credenciales activas del miembro', async () => {
    prisma.accessCredential.updateMany.mockResolvedValue({ count: 2 });

    const count = await service.revokeAllForMember('m-1', 'MEMBERSHIP_CANCELLED');

    expect(count).toBe(2);
    expect(prisma.accessCredential.updateMany).toHaveBeenCalledWith({
      where: { memberId: 'm-1', isActive: true },
      data: { isActive: false, revokedReason: 'MEMBERSHIP_CANCELLED' },
    });
  });
});