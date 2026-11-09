# CoworkSpace · Access Control Service

![CI-CD](https://github.com/CoworkSpace-Arquitectura/coworkspace-access/actions/workflows/deploy.yml/badge.svg)

Microservicio de control de acceso físico. Emite credenciales QR de corta duración, valida el acceso en la puerta y revoca las credenciales al escuchar el evento `membership.expired`.

- **Endpoints:** `/credentials`, `/access/validate`, `/access/logs`
- **Puerto local:** 3003
- **Depende de:** Membership Service (REST) y Redis (eventos)