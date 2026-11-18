import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/setup-app.js';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { MembershipClient } from '../../src/credentials/membership.client.js';

/**
 * Integración: emitir credencial → validarla en la puerta → reemplazarla, con PostgreSQL real.
 * Membership (otro microservicio) se sustituye por un doble que confirma la membresía activa.
 */
describe('Control de acceso (integración con la base de datos)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const memberId = randomUUID();
  const locationId = randomUUID();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MembershipClient)
      .useValue({ assertActiveMembership: () => Promise.resolve() })
      .compile();
    app = configureApp(moduleRef.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.accessLog.deleteMany({ where: { memberId } });
    await prisma.accessCredential.deleteMany({ where: { memberId } });
    await app.close();
  });

  it('la credencial emitida abre la puerta y queda registrado en la bitácora', async () => {
    const issued = await request(app.getHttpServer()).post('/credentials').send({ memberId }).expect(201);

    const res = await request(app.getHttpServer())
      .post('/access/validate')
      .send({ token: issued.body.token, locationId })
      .expect(200);
    expect(res.body).toEqual({ granted: true, reason: 'OK', memberId });

    const logs = await prisma.accessLog.findMany({ where: { memberId, locationId } });
    expect(logs).toHaveLength(1);
  });

  it('al generar una credencial nueva, la anterior deja de servir', async () => {
    const vieja = await request(app.getHttpServer()).post('/credentials').send({ memberId }).expect(201);
    await request(app.getHttpServer()).post('/credentials').send({ memberId }).expect(201);

    const res = await request(app.getHttpServer())
      .post('/access/validate')
      .send({ token: vieja.body.token, locationId })
      .expect(200);
    expect(res.body).toMatchObject({ granted: false, reason: 'CREDENTIAL_REVOKED' });
  });

  it('publica la documentación de la API (OpenAPI)', async () => {
    const res = await request(app.getHttpServer()).get('/docs-json').expect(200);
    expect(res.body.openapi).toBeDefined();
    expect(Object.keys(res.body.paths).length).toBeGreaterThan(0);
  });
});
