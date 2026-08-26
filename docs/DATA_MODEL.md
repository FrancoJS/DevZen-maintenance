# Modelo de datos mínimo recomendado

## Estado de la decisión

La sección 12 del Word propone los conceptos siguientes como **recomendación de implementación**, adaptable a las convenciones del proyecto. El repositorio no contiene ORM, esquema ni migraciones; por tanto, este documento no decide tablas, cardinalidades físicas, índices, tipos SQL ni estrategia de IDs.

Las restricciones funcionales sí son obligatorias aunque cambie la forma de persistirlas.

## Entidades recomendadas

### `User`

- **Propósito:** identidad autenticada y actor de acciones.
- **Campos sugeridos por la especificación:** `id`, `name`, `email`, `passwordHash`, `role`.
- **Relaciones conceptuales:** crea tickets; actúa en historial; puede participar como técnico o administrador.
- **Restricciones:** no exponer `passwordHash`; roles canónicos; contraseñas según estrategia de autenticación finalmente aprobada.

### `Ticket`

- **Propósito:** entidad principal y única identidad del ciclo.
- **Campos sugeridos:** `id`, `description`, `area`, `location`, `asset`, `priority`, `status`, `requesterId`, `currentTechnicianId?`, `createdAt`, `assignedAt?`, `startedAt?`, `resolvedAt?`, `closedAt?`.
- **Relaciones conceptuales:** solicitante, evaluación de impacto, mantención, congelamientos, asignaciones e historial.
- **Restricciones:** una falla por ticket; estado inicial `NEW`; sin eliminación física; `CLOSED` inmutable; técnico actual coherente con la asignación activa.

`asset` es el nombre sugerido en el Word para máquina/equipo; el nombre definitivo del campo es una decisión técnica pendiente.

### `ImpactAssessment`

- **Propósito:** conservar las respuestas que explican la prioridad automática.
- **Campos sugeridos:** `ticketId`, `safetyRisk`, `equipmentStopped`, `productionImpact`, `workaroundAvailable`, `affectsOtherAreas`.
- **Relación:** pertenece al ticket evaluado.
- **Restricciones:** las cinco respuestas son obligatorias al crear; prioridad calculada en backend.

### `Maintenance`

- **Propósito:** información técnica del trabajo dentro del ticket.
- **Campos sugeridos:** `ticketId`, `diagnosis`, `workPerformed`, `notes`, `finalEvidenceUrl?`.
- **Relación:** corresponde al mismo ticket, no a un flujo independiente.
- **Restricciones:** solo técnico actual puede escribir; `workPerformed` obligatorio al resolver; observaciones y evidencia final opcionales según alcance.

La obligatoriedad exacta de `diagnosis` al resolver debe alinearse con el contrato UI/dominio futuro; el Word exige registrarlo como dato técnico, pero solo declara expresamente obligatorio `workPerformed` al resolver.

### `FreezeRequest`

- **Propósito:** conservar solicitud y decisión administrativa de congelamiento.
- **Campos sugeridos:** `id`, `ticketId`, `technicianId`, `reasonType`, `reasonDetail?`, `status`, `requestedAt`, `reviewedBy?`, `reviewedAt?`.
- **Relaciones:** ticket, técnico solicitante y administrador revisor.
- **Restricciones:** nace desde `IN_PROGRESS`; motivo obligatorio; `reasonDetail` obligatorio para “Otro”; decisión solo por `ADMIN`.

### `TicketHistory`

- **Propósito:** trazabilidad cronológica.
- **Campos sugeridos:** `id`, `ticketId`, `actorId`, `action`, `previousStatus?`, `newStatus?`, `details?`, `createdAt`.
- **Relaciones:** ticket y actor.
- **Restricciones:** conservar eventos relevantes; actor y timestamp obligatorios; estados/detalle cuando apliquen.

### `AssignmentHistory`

- **Propósito:** preservar participación técnica sin sobrescribir asignaciones anteriores.
- **Campos sugeridos:** `id`, `ticketId`, `technicianId`, `assignedBy`, `assignedAt`, `releasedAt`, `releaseReason`.
- **Relaciones:** ticket, técnico y administrador que asigna.
- **Restricciones:** una sola asignación activa por ticket; técnico con máximo una mantención activa; liberación al aprobar congelamiento o resolver.

## Enumeraciones sugeridas

### `Role`

- `REQUESTER` — Solicitante.
- `TECHNICIAN` — Técnico.
- `ADMIN` — Administrador.

### `Priority`

- `LOW` — Baja.
- `MEDIUM` — Media.
- `HIGH` — Alta.
- `CRITICAL` — Crítica.

### `TicketStatus`

- `NEW` — Nueva.
- `ASSIGNED` — Asignada.
- `IN_PROGRESS` — En proceso.
- `FREEZE_REQUESTED` — Congelamiento solicitado.
- `FROZEN` — Congelada.
- `PENDING_REASSIGNMENT` — Pendiente de reasignación.
- `RESOLVED` — Resuelta.
- `CLOSED` — Cerrada.

### `FreezeRequestStatus`

- `PENDING` — Pendiente.
- `APPROVED` — Aprobada.
- `REJECTED` — Rechazada.

## Restricciones que debe preservar cualquier diseño

- Identidad única del ticket (`RN-01`).
- Ownership y autorización derivados del usuario autenticado.
- Prioridad explicable mediante respuestas persistidas.
- Disponibilidad derivada, nunca un flag manual fuente de verdad.
- Protección concurrente de capacidad máxima (`RN-20`).
- Historial de asignaciones y congelamientos no destructivo.
- Actualizaciones atómicas en acciones que afectan varias entidades conceptuales.
- PostgreSQL como persistencia requerida por la especificación.

## Pendiente técnico

ORM, nombres físicos, claves, relaciones exactas, estrategia de bloqueo/restricción, migraciones y formato de IDs deben definirse antes de implementar. Véase [PENDING_DECISIONS.md](PENDING_DECISIONS.md).

