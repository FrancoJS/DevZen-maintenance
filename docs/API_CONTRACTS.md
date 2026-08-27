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

### Listar tickets

`GET /api/tickets?page=1&limit=20&status?&priority?`

- **Actor:** autenticado.
- **Visibilidad:** `REQUESTER` y `TECHNICIAN` ven solo tickets creados por sí mismos; `ADMIN` ve todos. La visibilidad técnica por asignación pertenece a una fase posterior.
- **Consulta:** `page` desde 1, `limit` entre 1 y 100, filtros opcionales por estado y prioridad; orden `createdAt DESC, id DESC`.
- **Respuesta `200`:** `{ items, page, limit, total, totalPages }`.

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

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Precondición:** ticket `NEW` o `PENDING_REASSIGNMENT`; técnico disponible.
- **Efecto:** crear asignación histórica activa, definir `currentTechnicianId`, ocupar técnico.
- **Cambio:** `NEW|PENDING_REASSIGNMENT -> ASSIGNED`.
- **Validaciones:** rol, transición, disponibilidad a tiempo de escritura y concurrencia (`RN-20`).

## Mantención

### Iniciar

**Contrato pendiente de definición.**

- **Actor:** técnico actual.
- **Precondición:** ticket `ASSIGNED`.
- **Efecto:** registrar inicio.
- **Cambio:** `ASSIGNED -> IN_PROGRESS`.
- **Validaciones:** identidad igual a `currentTechnicianId` y transición.

### Actualizar información técnica

**Contrato pendiente de definición.**

- **Actor:** técnico actual.
- **Datos:** diagnóstico, trabajo realizado, observaciones; evidencia solo si se incluye.
- **Precondición/estados exactos para edición parcial:** contrato pendiente de definición. La resolución sí exige `IN_PROGRESS`.

### Resolver

**Contrato pendiente de definición.**

- **Actor:** técnico actual.
- **Precondición:** ticket `IN_PROGRESS`; `workPerformed` obligatorio.
- **Efecto:** registrar resolución, liberar asignación, limpiar `currentTechnicianId`, dejar técnico disponible e historial intacto.
- **Cambio:** `IN_PROGRESS -> RESOLVED`.

### Cerrar administrativamente

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Precondición:** ticket `RESOLVED`.
- **Efecto:** registrar administrador, timestamp y observación final opcional; volver inmutable.
- **Cambio:** `RESOLVED -> CLOSED`.

## Congelamiento

### Solicitar

**Contrato pendiente de definición.**

- **Actor:** técnico actual.
- **Precondición:** `IN_PROGRESS`; motivo obligatorio; detalle obligatorio para “Otro”.
- **Efecto:** crear `FreezeRequest`; conservar asignación/técnico ocupado.
- **Cambio:** `IN_PROGRESS -> FREEZE_REQUESTED`.

### Aprobar o rechazar

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Precondición:** `FREEZE_REQUESTED` pendiente.
- **Aprobación:** `FROZEN`, libera asignación/técnico y limpia `currentTechnicianId`.
- **Rechazo:** `IN_PROGRESS`, mantiene asignación/técnico ocupado.
- **Validaciones:** decisión única, rol, estado y actualización atómica.

### Marcar bloqueo resuelto

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Precondición:** ticket `FROZEN` y causa resuelta.
- **Efecto/cambio:** `FROZEN -> PENDING_REASSIGNMENT`; no asigna automáticamente.

## Técnicos

### Listar disponibilidad

**Contrato pendiente de definición.**

- **Actor:** `ADMIN`.
- **Efecto:** devolver técnicos con disponibilidad derivada y ticket actual cuando estén ocupados.
- **Validaciones:** calcular desde estados activos; no aceptar edición manual.

## Historial

### Consultar por ticket, historial técnico o global

**Contrato pendiente de definición.**

- **Actor:** propietario/autorizado para el ticket, técnico participante para su historial o `ADMIN` para global.
- **Efecto:** devolver cronología con actor, timestamp, acción, estados y detalle relevante.
- **Validaciones:** alcance por rol y control de volumen/paginación por definir.

## Dashboard

### Obtener agregaciones

**Contrato pendiente de definición y funcionalidad opcional.**

- **Actor:** `ADMIN`.
- **Datos posibles respaldados:** totales por estado/prioridad, críticos, sin asignar y tiempo promedio si se autoriza.
- **Validaciones:** el tiempo activo suma solo períodos `IN_PROGRESS`, excluyendo `FROZEN` y `PENDING_REASSIGNMENT`.
