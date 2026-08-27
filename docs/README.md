# Documentación del sistema de tickets de mantenimiento

## Propósito

Esta carpeta reúne la referencia funcional y técnica para desarrollar el MVP de mantenimiento correctivo de maquinarias del Hackaton LuxNova INACAP 2026. Su objetivo es mantener alineados frontend, backend, pruebas y preparación del pitch sin convertir supuestos en requisitos.

## Descripción breve

El producto reemplaza reportes informales de fallas por un flujo trazable. Un único `Ticket` conserva su identidad desde la solicitud inicial hasta la resolución técnica y el cierre administrativo. El sistema contempla tres roles (`REQUESTER`, `TECHNICIAN`, `ADMIN`), prioridad automática, asignación con capacidad máxima, congelamiento con aprobación, reasignación e historial.

## Alcance del MVP

El MVP se limita al mantenimiento correctivo de maquinarias. Incluye autenticación y autorización por rol, gestión de tickets, persistencia PostgreSQL, flujo completo de estados, prioridad determinística, disponibilidad derivada, asignación y reasignación, congelamiento, resolución, cierre e historial. Los filtros avanzados, gráficos, métricas y evidencia fotográfica son valor adicional, no requisitos obligatorios.

## Fuentes documentales y precedencia

1. Decisiones explícitas posteriores, claramente aprobadas y registradas en el repositorio.
2. `Especificacion_Funcional_Sistema_Tickets_Mantenimiento.docx`, versión del 25 de agosto de 2026.
3. `AGENTS.md`, como guía de desarrollo, arquitectura, seguridad y validación.
4. `DesafioHackaton.pdf`, desafío oficial.
5. Código existente, solo como evidencia de implementación actual.

No se encontraron decisiones funcionales adicionales que modifiquen la especificación. Las decisiones técnicas aprobadas para autenticación JWT y documentación OpenAPI quedan registradas en [PENDING_DECISIONS.md](PENDING_DECISIONS.md). `AGENTS.md` no reemplaza reglas funcionales del Word; sus precisiones compatibles se incorporan como criterios técnicos.

## Estado actual observado del repositorio

- Monorepo Nx `23.1.1`.
- Gestor de paquetes observado: npm (`package-lock.json`). El repositorio no declara una versión de Node en `.nvmrc`, `.node-version` ni `engines`.
- Frontend Angular `22.0.x` en `apps/web`.
- Backend NestJS `11.x` en `apps/api`.
- Proyectos E2E: `apps/web-e2e` y `apps/api-e2e`.
- El backend incorpora configuración TypeORM, entidades de persistencia, migración inicial y seed de usuarios.
- La autenticación JWT stateless está implementada: `POST /api/auth/login` es público, `GET /api/auth/me` requiere Bearer JWT y las rutas NestJS quedan protegidas globalmente por defecto.
- La autorización gruesa usa `@Roles(...)`; ownership, técnico asignado y estado del ticket permanecen como reglas de dominio pendientes de los servicios de tickets.
- Swagger/OpenAPI se expone únicamente en desarrollo mediante `/api/docs` y `/api/docs-json`, con el esquema Bearer `access-token`.
- Los tickets implementan creación, listado, detalle, edición propia `NEW`, asignación inicial transaccional, congelamiento, inicio, registro técnico en `IN_PROGRESS`, resolución con liberación atómica y cierre administrativo. Administración puede consultar la bandeja de congelamientos y agregaciones operativas de dashboard. El técnico puede consultar sus mantenciones históricas liberadas.

## Índice y guía de consulta

| Documento                                                  | Consultar cuando se necesite...                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------ |
| [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md)                 | Entender el problema, objetivo, actores y límites del producto.          |
| [MVP_SCOPE.md](MVP_SCOPE.md)                               | Distinguir obligatorio, valor adicional y fuera de alcance.              |
| [DOMAIN_MODEL.md](DOMAIN_MODEL.md)                         | Comprender conceptos, relaciones e invariantes del dominio.              |
| [ROLES_AND_PERMISSIONS.md](ROLES_AND_PERMISSIONS.md)       | Resolver dudas sobre visibilidad, permisos y prohibiciones.              |
| [TICKET_LIFECYCLE.md](TICKET_LIFECYCLE.md)                 | Consultar estados, transiciones y efectos laterales.                     |
| [BUSINESS_RULES.md](BUSINESS_RULES.md)                     | Revisar el registro completo `RN-01` a `RN-21`.                          |
| [PRIORITY_RULES.md](PRIORITY_RULES.md)                     | Implementar o probar el cálculo determinístico de prioridad.             |
| [TECHNICIAN_ASSIGNMENT.md](TECHNICIAN_ASSIGNMENT.md)       | Implementar disponibilidad, capacidad, asignación y concurrencia.        |
| [FREEZE_WORKFLOW.md](FREEZE_WORKFLOW.md)                   | Implementar congelamiento, liberación y reanudación.                     |
| [DATA_MODEL.md](DATA_MODEL.md)                             | Consultar el modelo persistente y sus restricciones ya implementadas.    |
| [API_CONTRACTS.md](API_CONTRACTS.md)                       | Alinear operaciones funcionales entre frontend y backend.                |
| [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md)     | Revisar pantallas mínimas y restricciones por rol/estado.                |
| [ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md)           | Consultar `CA-01` a `CA-14` y escenarios de validación.                  |
| [DEMO_FLOW.md](DEMO_FLOW.md)                               | Preparar la demostración normal y el flujo de congelamiento.             |
| [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md) | Planificar trabajo pendiente por backend, frontend y datos demo.         |
| [PENDING_DECISIONS.md](PENDING_DECISIONS.md)               | Consultar conflictos, contratos ambiguos y decisiones técnicas abiertas. |

## Convenciones

- Texto funcional y visible: español.
- Identificadores técnicos: inglés, por ejemplo `IN_PROGRESS` — En proceso.
- IDs funcionales conservados: `RN-01` a `RN-21` y `CA-01` a `CA-14`.
- “Solicitud”, “mantención” y “cierre” son etapas o secciones del mismo `Ticket`.
- La especificación describe requisitos; la sección “Estado actual” describe evidencia del código existente.
