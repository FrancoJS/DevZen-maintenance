# Contratos funcionales frontend/backend

## Criterio de documentación

La API aplica el prefijo global `/api`; las rutas de este documento muestran por tanto sus URL efectivas. Los contratos de autenticación implementados se describen con precisión. Para las capacidades de tickets, el Word describe operaciones pero no rutas HTTP exactas, por lo que se mantiene **Contrato pendiente de definición** donde no existe un endpoint aprobado.

Todos los contratos protegidos deben derivar actor y rol de la identidad autenticada. Los cambios de estado, ownership, técnico actual, prioridad y disponibilidad se validan en backend.

## Autenticación

### Iniciar sesión — `POST /api/auth/login`

- **Actor:** usuario con credenciales válidas.
- **Precondición:** credenciales recibidas y validadas.
- **Efecto:** emitir un JWT stateless para permitir el acceso autenticado y obtener el usuario actual.
- **Cambio de estado:** ninguno sobre tickets.
- **Entrada:** `LoginDto` con `email` válido y `password` no vacía. Las propiedades desconocidas se rechazan.
- **Respuesta `200`:** `{ accessToken, user }`, donde `user` contiene únicamente `id`, `name`, `email` y `role`.
- **JWT:** firmado con HS256, con payload `{ sub, role, iat, exp }` y vigencia de `28.800` segundos (8 horas).
- **Validaciones backend:** autenticidad, rol persistido y no proveniente del cliente.
- **Errores:** `400` para DTO inválido; `401` (`Credenciales inválidas`) para email inexistente o contraseña incorrecta.

### Obtener usuario actual — `GET /api/auth/me`

- **Actor:** autenticado.
- **Autorización:** Bearer JWT válido en `Authorization: Bearer <accessToken>`.
- **Efecto:** devolver identidad y rol efectivos sin exponer `passwordHash`.
- **Respuesta `200`:** `{ id, name, email, role }`, con `role` en `REQUESTER`, `TECHNICIAN` o `ADMIN`.
- **Errores:** `401` si falta el token, es inválido/expirado o el usuario ya no existe.

### Autorización transversal

- Todas las rutas NestJS requieren autenticación por defecto mediante `JwtAuthGuard` global.
- `@Public()` marca explícitamente una excepción pública; actualmente solo se aplica a `/api/auth/login`.
- `@Roles(...)` restringe por el rol firmado en el JWT y responde `403` cuando no hay coincidencia.
- `@CurrentUser()` entrega la identidad autenticada `{ id, role }` al controlador.
- Ownership, técnico asignado, estado del ticket y demás autorización contextual se validarán en servicios de dominio; no se delegan únicamente a `RolesGuard`.
- El logout queda fuera del backend: el cliente elimina el token. No se implementan refresh tokens, sesiones ni blacklist.

### Documentación OpenAPI (solo desarrollo)

- Disponible únicamente cuando `NODE_ENV=development`.
- UI: `GET /api/docs`.
- JSON: `GET /api/docs-json`.
- El esquema Bearer JWT se denomina `access-token` y se declara globalmente.
- El login documenta `security: []`; `/api/auth/me` hereda el requisito Bearer.
- Los schemas documentados son `LoginDto`, `LoginResponseDto` y `AuthenticatedUserResponseDto`; ninguno expone `passwordHash`, secretos ni credenciales reales.

## Tickets

### Crear ticket

`POST /api/tickets`

- **Actor:** cualquier rol autenticado.
- **Entrada:** `description`, `location`, `asset` y `impactAssessment` con las cinco respuestas obligatorias. No existe `area`.
- **Efecto:** en una transacción, persiste ticket `NEW`, evaluación, prioridad automática e historial `TICKET_CREATED`.
- **Datos derivados:** requester/timestamps desde backend; prioridad calculada exclusivamente por backend.
- **Respuesta `201`:** detalle del ticket, evaluación e historial.
- **Errores:** `400` para DTO inválido o propiedades no permitidas.

### Listar mis solicitudes

`GET /api/tickets?page=1&limit=20&status?&priority?`

- **Actor:** autenticado.
- **Visibilidad:** todos los roles (`REQUESTER`, `TECHNICIAN` y `ADMIN`) ven únicamente tickets creados por sí mismos. El backend filtra por `requesterId` de la identidad autenticada antes de paginar y contar resultados.
- **Consulta:** `page` desde 1, `limit` entre 1 y 100, filtros opcionales por estado y prioridad; orden `createdAt DESC, id DESC`.
- **Respuesta `200`:** `{ items, page, limit, total, totalPages }`.

Este endpoint corresponde a **Mis solicitudes**. El listado/historial global administrativo será una capacidad separada, todavía sin implementar ni contrato de ruta definido. El acceso administrativo al detalle de un ticket no cambia.

### Obtener detalle e historial

`GET /api/tickets/:id`

- **Actor:** propietario o `ADMIN`; el técnico conserva en esta fase el alcance de solicitante.
- **Efecto:** devuelve solicitud, evaluación de impacto e historial cronológico con actor seguro `{ id, name }`.
- **Errores:** `404` tanto si el ticket no existe como si no es visible, para no revelar recursos ajenos.

### Editar solicitud

`PATCH /api/tickets/:id`

- **Actor:** creador autenticado.
- **Precondición:** ticket propio `NEW`.
- **Entrada:** solo `description`.
- **Efecto:** actualiza descripción e historial `TICKET_UPDATED` atómicamente; estado y prioridad permanecen sin cambios.
- **Errores:** `404` si no existe/no es visible; `409` si no está `NEW`; `400` para DTO inválido o campos no permitidos.

No existe contrato de eliminación física ni reapertura.

## Prioridad

### Calcular durante creación

No se define endpoint independiente. El cálculo forma parte de crear el ticket.

- **Actor:** sistema/backend.
- **Precondición:** cinco respuestas válidas.
- **Efecto:** calcular en orden `CRITICAL -> HIGH -> MEDIUM -> LOW` y persistir explicación.

### Corregir prioridad

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Precondición:** prioridad nueva válida y motivo no vacío; ticket no `CLOSED` por inmutabilidad.
- **Efecto:** actualizar prioridad y registrar valor anterior/nuevo, motivo, actor y timestamp.
- **Validaciones:** rol, motivo, estado y transacción con historial.

## Asignación

### Asignar o reasignar

`POST /api/tickets/:id/assign`

- **Actor:** `ADMIN`.
- **Entrada:** `{ technicianId }`, UUID v4 de un usuario con rol `TECHNICIAN`.
- **Precondición:** ticket `NEW` o `PENDING_REASSIGNMENT`; técnico disponible.
- **Efecto:** crear asignación histórica activa, definir `currentTechnicianId`, ocupar técnico y registrar `TECHNICIAN_ASSIGNED`.
- **Cambio:** `NEW -> ASSIGNED` o `PENDING_REASSIGNMENT -> ASSIGNED`.
- **Validaciones:** rol, transición, disponibilidad a tiempo de escritura y concurrencia (`RN-20`). Las restricciones únicas parciales de PostgreSQL se traducen a `409`.
- **Errores:** `400` para destinatario inválido/no técnico, `404` para ticket/técnico inexistente y `409` para ticket fuera de `NEW`/`PENDING_REASSIGNMENT` o técnico ocupado.

La reasignación desde `PENDING_REASSIGNMENT` pertenece al flujo de congelamiento y reutiliza este mismo contrato.

## Mantención

### Iniciar

`POST /api/tickets/:id/start`

- **Actor:** técnico actual.
- **Precondición:** ticket `ASSIGNED` y una asignación activa del técnico autenticado.
- **Efecto:** registra `startedAt`, crea el registro de mantención vacío cuando no existe y agrega `MAINTENANCE_STARTED` al historial.
- **Cambio:** `ASSIGNED -> IN_PROGRESS`.
- **Validaciones:** identidad igual a `currentTechnicianId`, transición y asignación activa coherente.
- **Errores:** `403` para técnico no asignado, `404` para ticket inexistente y `409` para estado/asignación incompatibles.

### Actualizar información técnica

`PATCH /api/tickets/:id/maintenance`

- **Actor:** técnico actual.
- **Datos:** `diagnosis`, `workPerformed`, `notes`; todos opcionales y anulables de forma individual. Debe enviarse al menos un campo.
- **Precondición:** técnico actual y ticket `IN_PROGRESS`.
- **Efecto:** actualiza únicamente los campos enviados y registra `MAINTENANCE_UPDATED` con los valores anterior/nuevo. Una solicitud sin cambios no genera evento ficticio.
- **Límites:** no incluye evidencia final ni permite registrar información antes de iniciar.
- **Errores:** `400` para cuerpo sin campos, `403` para técnico no asignado, `404` para ticket inexistente y `409` para estado/mantención incompatibles.

### Resolver

`POST /api/tickets/:id/resolve`

- **Actor:** técnico actual.
- **Entrada:** `{ workPerformed }`, texto obligatorio y no vacío después de normalizar espacios.
- **Precondición:** ticket `IN_PROGRESS`, técnico autenticado igual a `currentTechnicianId`, asignación activa coherente e información técnica existente.
- **Efecto:** guarda el trabajo final, registra `resolvedAt` y `resolvedById`, libera la asignación con motivo `RESOLVED`, limpia `currentTechnicianId` y agrega `TICKET_RESOLVED` al historial.
- **Cambio:** `IN_PROGRESS -> RESOLVED`.
- **Respuesta `200`:** detalle actualizado, incluyendo los datos de resolución y la participación liberada.
- **Errores:** `400` para cuerpo/identificador inválido, `403` para técnico no asignado, `404` para ticket inexistente y `409` para estado o asignación/mantención incompatibles.

### Cerrar administrativamente

`POST /api/tickets/:id/close`

- **Actor:** `ADMIN`.
- **Entrada:** `{ note? }`; observación opcional, anulable y normalizada. Una observación vacía no se conserva.
- **Precondición:** ticket `RESOLVED`.
- **Efecto:** registra `closedAt` y `closedById`; si existe observación, la conserva en `TicketHistory.details`; agrega `TICKET_CLOSED` y vuelve el ticket inmutable.
- **Cambio:** `RESOLVED -> CLOSED`.
- **Respuesta `200`:** detalle actualizado, incluyendo los datos de cierre.
- **Errores:** `400` para cuerpo/identificador inválido, `403` para actor no administrador, `404` para ticket inexistente y `409` para cualquier estado distinto de `RESOLVED`.

## Congelamiento

### Solicitar

`POST /api/tickets/:id/freeze-requests`

- **Actor:** técnico actual.
- **Precondición:** `IN_PROGRESS`; motivo obligatorio; detalle obligatorio para “Otro”.
- **Efecto:** crear `FreezeRequest`; conservar asignación/técnico ocupado.
- **Cambio:** `IN_PROGRESS -> FREEZE_REQUESTED`.
- **Entrada:** `{ reasonType, reasonDetail? }`; `OTHER` exige detalle no vacío.

### Aprobar o rechazar

`POST /api/tickets/:id/freeze-requests/:freezeRequestId/approve` y
`POST /api/tickets/:id/freeze-requests/:freezeRequestId/reject`.

- **Actor:** `ADMIN`.
- **Precondición:** `FREEZE_REQUESTED` pendiente.
- **Aprobación:** `FROZEN`, libera asignación/técnico y limpia `currentTechnicianId`.
- **Rechazo:** `IN_PROGRESS`, mantiene asignación/técnico ocupado.
- **Validaciones:** decisión única, rol, estado y actualización atómica.
- **Entrada de aprobación:** `{ reviewNote? }`. **Entrada de rechazo:**
  `{ reviewNote }`, obligatorio y no vacío.

### Bandeja administrativa de solicitudes

`GET /api/freeze-requests`

- **Actor:** `ADMIN`.
- **Efecto:** devuelve todas las solicitudes sin paginación ni filtros, como
  `{ items, total }`.
- **Cada elemento:** datos de la solicitud, técnico solicitante, revisor cuando
  exista y ticket asociado `{ id, description, asset, priority, status }`.
- **Visibilidad:** no está disponible para `REQUESTER` ni `TECHNICIAN`.

### Marcar bloqueo resuelto

`POST /api/tickets/:id/resolve-blocker` sin cuerpo.

- **Actor:** `ADMIN`.
- **Precondición:** ticket `FROZEN` y causa resuelta.
- **Efecto/cambio:** `FROZEN -> PENDING_REASSIGNMENT`; no asigna automáticamente.

## Técnicos

### Listar disponibilidad

`GET /api/technicians?page=1&limit=20`

- **Actor:** `ADMIN`.
- **Efecto:** devuelve `{ items, page, limit, total, totalPages }`; cada técnico incluye identidad segura, `availability` y `currentTicket` cuando está ocupado.
- **Validaciones:** `BUSY` se deriva de tickets `ASSIGNED`, `IN_PROGRESS` o `FREEZE_REQUESTED`; no existe edición manual de disponibilidad.

### Mantención actual

`GET /api/tickets/my-maintenance`

- **Actor:** `TECHNICIAN`.
- **Efecto:** devuelve `{ ticket }`, con el detalle de la asignación actual o `ticket: null` si no existe.
- **Visibilidad:** no cambia el listado general de solicitudes propias; únicamente habilita el detalle del ticket donde el técnico es el responsable actual.

### Historial de mantenciones del técnico

`GET /api/tickets/my-maintenance-history?page=1&limit=20&status?&priority?`

- **Actor:** `TECHNICIAN`.
- **Efecto:** devuelve `{ items, page, limit, total, totalPages }` con tickets donde el técnico participó y cuya asignación ya fue liberada.
- **Orden y filtros:** paginación y filtros mínimos equivalentes al listado de tickets; orden `createdAt DESC, id DESC`.
- **Visibilidad:** habilita el detalle de cada ticket de participación histórica, pero no devuelve permisos de escritura.

## Historial

### Consultar historial global

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Efecto:** devolver cronología con actor, timestamp, acción, estados y detalle relevante.
- **Validaciones:** alcance por rol y control de volumen/paginación por definir.

## Dashboard

### Obtener agregaciones administrativas

`GET /api/dashboard/admin`

- **Actor:** `ADMIN`.
- **Efecto:** devuelve agregaciones calculadas en backend, sin listas completas:
  - `tickets`: `total`, `new`, `critical`, `inProgress`, `frozen`;
  - `technicians`: `total`, `available`, `busy`;
  - `requiresAttention`: `pendingAssignment`, `pendingFreezeApproval`,
    `pendingReassignment`, `pendingClosure`.
- **Críticos:** incluye tickets `CRITICAL` salvo los estados `RESOLVED` y
  `CLOSED`.
- **Pendiente de asignación:** ticket `NEW` sin técnico actual ni asignación
  activa.
- **Tiempo promedio de resolución:** no se devuelve. Si se incorpora, debe
  sumar solo intervalos `IN_PROGRESS`, excluyendo espera de congelamiento,
  `FROZEN` y `PENDING_REASSIGNMENT`.
