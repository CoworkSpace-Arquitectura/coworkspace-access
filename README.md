# CoworkSpace · Access Service

![CI-CD](https://github.com/CoworkSpace-Arquitectura/coworkspace-access/actions/workflows/deploy.yml/badge.svg)

Microservicio de control de acceso: emite credenciales QR (guarda solo el hash del token), valida la entrada a la sede y registra la bitácora. Revoca las credenciales cuando vence el plan.

- **Despliegue:** https://coworkspace-access.onrender.com
- **Documentación de la API (Swagger):** https://coworkspace-access.onrender.com/docs
- **Puerto local:** 3003
- **Depende de:** Membership Service (REST) y Redis (eventos)

## Tecnologías

TypeScript, NestJS 12 y Node.js 24, Prisma 6 y PostgreSQL, Redis (ioredis) para eventos, Vitest y Supertest para pruebas, prom-client para métricas y @nestjs/swagger para la documentación. Se empaqueta con Docker.

## Instalación y ejecución local

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npx prisma migrate dev          # crea las tablas en tu base local
npm run start:dev           # http://localhost:3003
```

Producción: `npm run build` y `node dist/main.js` (o la imagen Docker del `Dockerfile`).

## Variables de entorno

Están en `.env.example`. El archivo `.env` real no se sube al repositorio (está en `.gitignore`); en Render se configuran como variables de entorno y en GitHub Actions como *secrets*.

| Variable | Para qué sirve | Ejemplo |
| --- | --- | --- |
| `DATABASE_URL` | Base de datos PostgreSQL del servicio (en producción: Neon) | `postgresql://postgres:postgres@localhost:5432/coworkspace_access` |
| `PORT` | Puerto HTTP | `3003` |
| `REDIS_URL` | Bus de eventos (en producción: Upstash Redis) | `redis://localhost:6379` |
| `MEMBERSHIP_URL` | Servicio de membresías (para validar el plan activo) | `http://localhost:3002` |
| `CREDENTIAL_TTL_HOURS` | Horas de validez de una credencial QR | `24` |

## Base de datos

- PostgreSQL propio del servicio (en producción, una base en Neon). Ningún otro servicio accede a ella.
- Esquema en `prisma/schema.prisma` y 1 migraciones versionadas en `prisma/migrations/`.
- Las migraciones se aplican solas al arrancar el contenedor (`npx prisma migrate deploy`); en local: `npx prisma migrate dev`.
- Datos de ejemplo: las peticiones de `requests.http` (extensión REST Client de VS Code) crean datos de prueba.
- Respaldo: Neon permite restaurar la base a un punto anterior desde su panel.

## Endpoints

| Método | Ruta |
| --- | --- |
| POST | `/access/validate` |
| GET | `/access/logs` |
| POST | `/credentials` |
| GET | `/credentials` |
| GET | `/metrics` (métricas para Prometheus) |
| GET | `/docs` (Swagger UI) |

## Eventos (Redis Pub/Sub)

- **Escucha:** `membership.expired`

## Pruebas

Pruebas unitarias en `src/**/*.spec.ts` (con mocks de la base, de otros servicios y de las APIs externas) y una prueba de integración en `test/integration/` contra un PostgreSQL y un Redis reales.

```bash
npx vitest run --exclude "test/**"   # solo unitarias, sin base de datos
npm test                              # unitarias + integración (requiere DATABASE_URL y REDIS_URL)
npm run test:cov                      # con reporte de cobertura (carpeta coverage/)
```

En GitHub Actions las pruebas corren contra PostgreSQL 16 y Redis 7 reales, y el reporte de cobertura queda como artefacto `cobertura-access`.

## CI/CD

`.github/workflows/deploy.yml` se ejecuta en cada push y pull request a `main` y llama al workflow reutilizable de [coworkspace-pipelines](https://github.com/CoworkSpace-Arquitectura/coworkspace-pipelines): lint, build, pruebas con cobertura → imagen Docker en GHCR → despliegue en Render. Si una prueba falla, no se construye la imagen ni se despliega. Los pull requests solo corren las pruebas.

## Monitoreo

`GET /metrics` expone métricas para Prometheus (peticiones por ruta y código, histograma de tiempos de respuesta y métricas del proceso). La configuración de Prometheus y el dashboard de Grafana están en `coworkspace-pipelines/monitoring`.
