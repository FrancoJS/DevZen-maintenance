# Disponibilidad y asignación de técnicos

## Disponibilidad derivada (`RN-19`)

La disponibilidad no es un campo editable. Se calcula a partir de las mantenciones activas del técnico.

Un técnico está `BUSY` — Ocupado si tiene un ticket en:

- `ASSIGNED`;
- `IN_PROGRESS`;
- `FREEZE_REQUESTED`.

Está `AVAILABLE` — Disponible cuando no tiene ningún ticket en esos estados.

| Situación | Estado visible | ¿Puede recibir otro ticket? |
|---|---|:---:|
| Sin mantención en estados activos | `AVAILABLE` | Sí |
| Ticket `ASSIGNED` | `BUSY` | No |
| Ticket `IN_PROGRESS` | `BUSY` | No |
| Ticket `FREEZE_REQUESTED` | `BUSY` | No |
| Ticket anterior `FROZEN` | `AVAILABLE` | Sí |
| Ticket anterior `RESOLVED` | `AVAILABLE` | Sí |

## Capacidad máxima (`RN-06`, `RN-07`)

Cada técnico puede tener como máximo una mantención activa. Un técnico ocupado no puede recibir una nueva asignación. El frontend debe impedir su selección, pero el backend vuelve a validar antes de escribir.

## Asignación (`RN-05`)

Solo `ADMIN` asigna. Una asignación es válida cuando:

- el ticket está `NEW` o `PENDING_REASSIGNMENT`;
- el técnico seleccionado está disponible;
- la disponibilidad se confirma en backend en el momento de la operación.

Efectos:

- ticket pasa a `ASSIGNED`;
- `currentTechnicianId` queda definido;
- técnico pasa a ocupado;
- se registra técnico, administrador y timestamp;
- se crea historial del cambio de estado.

## Reasignación (`RN-12`, `RN-13`)

Una mantención `FROZEN` primero debe pasar a `PENDING_REASSIGNMENT` por acción del administrador. Desde allí puede asignarse al técnico original o a otro, siempre que esté disponible. El nuevo vínculo es una asignación adicional; no reemplaza la anterior.

## Liberación

La asignación activa se libera cuando:

- se aprueba el congelamiento: ticket `FROZEN`, técnico disponible;
- el técnico resuelve: ticket `RESOLVED`, técnico disponible.

En ambos casos `currentTechnicianId` queda nulo y el historial de participación se conserva.

## Concurrencia (`RN-20`)

Si dos operaciones compiten por el mismo técnico disponible, solo una puede completarse. La solución debe usar la capacidad transaccional, bloqueo, restricción única o mecanismo equivalente del ORM/PostgreSQL finalmente elegidos. La estrategia concreta queda pendiente porque el repositorio todavía no contiene ORM ni esquema.

La operación debe ser atómica respecto de:

- comprobación de disponibilidad;
- cambio de estado del ticket;
- actualización de técnico actual;
- creación de `AssignmentHistory`;
- creación de `TicketHistory`.

## Historial de asignaciones

Cada asignación/reasignación conserva como mínimo:

- ticket;
- técnico;
- administrador que asignó;
- timestamp de asignación;
- timestamp de liberación cuando corresponda;
- motivo de liberación cuando corresponda.

No se usa `currentTechnicianId` como única fuente histórica.

## Validaciones y pruebas sugeridas

- Derivación `AVAILABLE`/`BUSY` para cada estado relevante: unit.
- Asignación válida desde `NEW`: integración.
- Rechazo de técnico ocupado: integración (`CA-05`).
- Reasignación desde `PENDING_REASSIGNMENT`: integración (`CA-10`).
- Intento desde un estado inválido: integración.
- Competencia concurrente por un técnico: integración con base de datos cuando el ORM esté definido.
- Liberación al aprobar congelamiento y resolver: integración (`CA-07`, `CA-08`).

