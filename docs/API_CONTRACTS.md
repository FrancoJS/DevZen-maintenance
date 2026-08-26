# Contratos funcionales frontend/backend

## Criterio de documentación

El Word define explícitamente solo `POST /auth/login`. Para las demás capacidades describe operaciones, no rutas HTTP exactas. En consecuencia, se documenta el contrato funcional y se marca **Contrato pendiente de definición** donde no existe endpoint aprobado.

Todos los contratos protegidos deben derivar actor y rol de la identidad autenticada. Los cambios de estado, ownership, técnico actual, prioridad y disponibilidad se validan en backend.

## Autenticación

### Iniciar sesión — `POST /auth/login`

- **Actor:** usuario con credenciales válidas.
- **Precondición:** credenciales recibidas y validadas.
- **Efecto:** establecer sesión/JWT según estrategia aún no definida y permitir obtener usuario actual.
- **Cambio de estado:** ninguno sobre tickets.
- **Datos relevantes:** credenciales de login; identidad/rol en respuesta o sesión según contrato futuro.
- **Validaciones backend:** autenticidad, rol persistido y no proveniente del cliente.

### Obtener usuario actual

**Contrato pendiente de definición.**

- **Actor:** autenticado.
- **Efecto:** devolver identidad y rol efectivos sin exponer `passwordHash`.

## Tickets

### Crear ticket

**Contrato pendiente de definición.**

- **Actor:** cualquier rol autenticado.
- **Precondición:** descripción, ubicación, máquina/equipo, área cuando aplique y cinco respuestas válidas.
- **Efecto:** persistir ticket, evaluación de impacto, prioridad calculada e historial de creación.
- **Cambio:** creación en `NEW`.
- **Datos derivados:** requester y timestamp desde backend; prioridad calculada.
- **Validaciones:** no confiar en requester/priority enviados por cliente.

### Listar tickets

**Contrato pendiente de definición.**

- **Actor:** autenticado.
- **Efecto:** `REQUESTER`/`TECHNICIAN` ven sus tickets creados; técnico además accede a su mantención/participación según operación; `ADMIN` ve todos.
- **Validaciones:** filtrado backend por identidad/rol.

### Obtener detalle e historial

**Contrato pendiente de definición.**

- **Actor:** propietario, técnico participante/actual según alcance, o `ADMIN`.
- **Efecto:** devolver secciones del mismo ticket y cronología autorizada.
- **Validaciones:** evitar fuga entre usuarios.

### Editar solicitud

**Contrato pendiente de definición.**

- **Actor:** creador autenticado.
- **Precondición:** ticket propio `NEW`.
- **Efecto:** actualizar datos permitidos y registrar cambio relevante.
- **Cambio:** permanece `NEW`.
- **Validaciones:** ownership, estado, campos editables. El Word no enumera con precisión los campos editables.

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

