import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessService } from './access.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

describe('AccessService', () => {
  const prisma = {
    accessCredential: { findUnique: vi.fn() },
    accessLog: { create: vi.fn() },
  };
  let service: AccessService;

  const dto = { token: 'token-de-prueba', locationId: '11111111-1111-4111-8111-111111111111' };
  const inOneHour = () => new Date(Date.now() + 60 * 60 * 1000);

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AccessService(prisma as unknown as PrismaService);
  });

  it('concede el acceso con una credencial activa y vigente', async () => {
    prisma.accessCredential.findUnique.mockResolvedValue({ memberId: 'm-1', isActive: true, expiresAt: inOneHour() });

    const result = await service.validate(dto);

    expect(result).toEqual({ granted: true, reason: 'OK', memberId: 'm-1' });
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ memberId: 'm-1', granted: true }),
    });
  });

  it('niega el acceso si la credencial fue revocada', async () => {
    prisma.accessCredential.findUnique.mockResolvedValue({ memberId: 'm-1', isActive: false, expiresAt: inOneHour() });

    const result = await service.validate(dto);

    expect(result.granted).toBe(false);
    expect(result.reason).toBe('CREDENTIAL_REVOKED');
  });

  it('niega el acceso si la credencial venció', async () => {
    prisma.accessCredential.findUnique.mockResolvedValue({
      memberId: 'm-1',
      isActive: true,
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await service.validate(dto);

    expect(result.reason).toBe('CREDENTIAL_EXPIRED');
  });

  it('niega y registra el intento con una credencial inexistente', async () => {
    prisma.accessCredential.findUnique.mockResolvedValue(null);

    const result = await service.validate(dto);

    expect(result).toEqual({ granted: false, reason: 'CREDENTIAL_NOT_FOUND', memberId: null });
    expect(prisma.accessLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ memberId: null, granted: false }),
    });
  });
});