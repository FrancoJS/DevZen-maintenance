# Decisiones y contratos pendientes

No se detectaron contradicciones funcionales entre el Word y `AGENTS.md`. Las entradas siguientes registran únicamente ambigüedades reales o decisiones técnicas necesarias que las fuentes no resuelven.

## `PD-001` — ORM y esquema PostgreSQL — Resuelta

- **Decisión aprobada:** TypeORM `0.3.31`, PostgreSQL, UUID v4 y migraciones explícitas con `synchronize: false`.
- **Implementación:** entidades por módulo, `InitialSchema` y DataSource CLI bajo `apps/api/src/database/`.

## `PD-002` — Estrategia de autenticación — Resuelta

- **Decisión aprobada:** autenticación stateless mediante JWT firmado con HS256.
- **Implementación:** `POST /api/auth/login` emite un token con `{ sub, role, iat, exp }`; la vigencia es de `28.800` segundos (8 horas).
- **Autorización:** `JwtAuthGuard` global protege las rutas por defecto; `@Public()` permite excepciones explícitas y `@Roles(...)` aplica autorización gruesa por rol.
- **Identidad:** `@CurrentUser()` entrega `{ id, role }`; ownership, técnico asignado y estado se validan en servicios de dominio.
- **Sesión:** no hay refresh tokens, blacklist ni endpoint de logout; el cliente elimina el token.

## `PD-003` — Endpoints y DTOs exactos — Parcialmente resuelta

- **Parte resuelta (autenticación):** `POST /api/auth/login` y `GET /api/auth/me`, junto con sus DTOs, respuestas, errores y requisitos Bearer, están definidos en [API_CONTRACTS.md](API_CONTRACTS.md).
- **Parte resuelta (OpenAPI):** durante desarrollo se exponen `/api/docs` y `/api/docs-json` con el esquema Bearer `access-token`.
- **Parte resuelta (núcleo de tickets):** `POST /api/tickets`, `GET /api/tickets`, `GET /api/tickets/:id` y `PATCH /api/tickets/:id`, con DTOs, respuestas, filtros mínimos y errores, se definen en `API_CONTRACTS.md`.
- **Parte pendiente:** contratos de técnicos, asignaciones, mantención, historial global y dashboard.
- **Fuentes:** Word 13.1; [API_CONTRACTS.md](API_CONTRACTS.md).

## `PD-004` — Campos editables del ticket `NEW` — Resuelta

- **Contexto:** `RN-02` permite editar la solicitud propia en `NEW`, pero no enumera qué campos pueden cambiarse ni cómo repercute en la prioridad.
- **Fuentes:** Word 3.1, 9.1, `RN-02`, `RN-03` y 13.1.
- **Decisión aprobada:** esta fase permite editar exclusivamente `description` en un ticket propio `NEW`.
- **Consecuencia:** la evaluación de impacto queda inmutable y no se recalcula prioridad durante `PATCH`; la edición registra `TICKET_UPDATED`.

## `PD-005` — Contrato de edición de información técnica

- **Contexto:** el técnico puede registrar diagnóstico/trabajo/observaciones, pero el Word no determina todos los estados permitidos para guardados parciales. Solo fija `IN_PROGRESS` para resolver/congelar y `workPerformed` obligatorio al resolver.
- **Fuentes:** Word 3.2, 9.3, `RN-08` y 13.1; `AGENTS.md`, Resolution.
- **Decisión requerida:** definir cuándo puede guardar cada campo y si `diagnosis` es obligatorio antes de resolver.
- **Impacto:** DTOs, validación, UX y pruebas.
- **Opciones conocidas:** no especificadas.

## `PD-006` — Campo área — Resuelta

- **Decisión aprobada:** `area` queda fuera del producto y no existe en el esquema ni en el futuro contrato backend.
- **Seguimiento:** el mock frontend aún lo solicita; deberá eliminarse en una fase frontend autorizada.

## `PD-007` — Motivo de rechazo de congelamiento

- **Contexto:** el motivo es obligatorio para solicitar, pero no se declara si el administrador debe motivar un rechazo.
- **Fuentes:** Word 8.1, 8.2 y modelo `FreezeRequest`; `AGENTS.md`, Freeze workflow.
- **Decisión requerida:** determinar obligatoriedad y formato del detalle de rechazo.
- **Impacto:** DTO, historial, pantalla administrativa y pruebas.
- **Opciones conocidas:** opcional u obligatorio; ninguna aprobada.

## `PD-008` — Límite entre dashboard obligatorio y opcional

- **Contexto:** el Word lista Dashboard como pantalla administrativa requerida, mientras 13.1 y 14.2 dejan agregaciones, gráficos y tiempo promedio condicionados al tiempo disponible.
- **Fuentes:** Word 10.4, 13.1 y 14.2; `AGENTS.md`, Minimum screens y Optional.
- **Decisión requerida:** confirmar si el MVP necesita una pantalla resumen mínima sin gráficos o si todo el dashboard se posterga.
- **Impacto:** navegación, alcance frontend/backend y demo.
- **Opciones conocidas:** resumen administrativo mínimo; dashboard completo opcional; postergación total.

## `PD-009` — Alcance de filtros básicos frente a completos — Parcialmente resuelta

- **Contexto:** “Mis solicitudes” menciona búsqueda/filtros básicos, mientras filtros y búsqueda completos son valor adicional.
- **Fuentes:** Word 10.2 y 14.2; `AGENTS.md`, Optional.
- **Decisión aprobada para API:** listado paginado con filtros opcionales por `status` y `priority`; no hay búsqueda ni filtros por fecha en esta fase.
- **Pendiente:** decidir si el frontend requiere filtros adicionales.

## `PD-010` — Protección concreta de concurrencia — Parcialmente resuelta

- **Decisión aprobada para persistencia:** índices únicos parciales impiden más de una asignación activa por ticket o técnico.
- **Pendiente:** la futura operación de asignación debe usar una transacción y manejar correctamente una violación de unicidad concurrente.

## `PD-011` — Contratos de listados e historial — Parcialmente resuelta

- **Contexto:** se requieren listados e historial, pero no se definen paginación, orden, límites ni formato de eventos.
- **Fuentes:** Word 10 y 13.1; `AGENTS.md`, Performance y History.
- **Decisión aprobada para núcleo:** listado con `page`, `limit`, `total` y `totalPages`, orden descendente por creación; detalle incluye cronología ascendente con actor, acción, estados/prioridades y detalle relevante.
- **Pendiente:** contratos de historial global y técnico, incluido su control de volumen.

## `PD-012` — Exposición de documentación OpenAPI — Resuelta

- **Decisión aprobada:** Swagger/OpenAPI solo se registra cuando `NODE_ENV=development`.
- **Implementación:** UI pública en `/api/docs` y documento JSON en `/api/docs-json`; fuera de desarrollo las rutas no se registran.
- **Seguridad documentada:** Bearer JWT global con nombre `access-token`; el login declara `security: []` y `/api/auth/me` permanece protegido.

## Diferencias documentales ya resueltas por precedencia

No requieren decisión pendiente:

- El PDF oficial trata prioridad e historial como valor adicional; el Word posterior los incorpora al MVP obligatorio del equipo.
- El PDF permite elegir tipo de mantenimiento; el Word fija mantenimiento correctivo.
- El PDF no exige documentación para la presentación; la tarea actual sí la solicita expresamente.

Estas diferencias representan decisiones posteriores respaldadas por la fuente de mayor precedencia, no conflictos ocultos.
