# Roles y permisos

## Regla de autorización

La interfaz debe ocultar o deshabilitar acciones inválidas, pero esto es solo UX. La identidad, el rol, la propiedad del ticket, el técnico actual y el estado deben validarse en el backend. No se confía en un rol, requester o técnico enviado por el cliente (`RN-18`).

## `REQUESTER` — Solicitante

### Puede ver

- Sus propios tickets, su detalle permitido y su historial.

### Puede crear o modificar

- Crear un ticket autenticado.
- Editar únicamente un ticket propio mientras esté `NEW`.

### Puede ejecutar

- Iniciar/cerrar sesión y consultar sus solicitudes.

### Tiene prohibido

- Ver todos los tickets.
- Asignar o reasignar técnicos.
- Iniciar, registrar o resolver mantenciones.
- Solicitar, aprobar o rechazar congelamientos.
- Marcar bloqueos resueltos.
- Elegir o corregir prioridad.
- Cerrar tickets.

## `TECHNICIAN` — Técnico

Conserva las capacidades de solicitante para tickets que él mismo crea.

### Puede ver

- Su mantención asignada actual.
- El historial de mantenciones en las que participó.
- Sus propios tickets creados como solicitante.

### Puede crear o modificar

- Crear y editar sus tickets propios bajo la regla de `REQUESTER`.
- Registrar diagnóstico, trabajo realizado, observaciones y evidencia cuando esta última se implemente.

### Puede ejecutar

- Iniciar su mantención desde `ASSIGNED`.
- Solicitar congelamiento desde `IN_PROGRESS` con motivo.
- Resolver su mantención desde `IN_PROGRESS` con trabajo realizado obligatorio.

### Tiene prohibido

- Autoasignarse o recibir más de una mantención activa.
- Operar sobre un ticket asignado a otro técnico.
- Aprobar/rechazar congelamientos o marcar bloqueos resueltos.
- Corregir prioridad o cerrar administrativamente.

## `ADMIN` — Administrador

Conserva las capacidades de solicitante para tickets que él mismo crea.

### Puede ver

- Todos los tickets y su detalle completo.
- Técnicos y disponibilidad derivada.
- Solicitudes de congelamiento.
- Historial global de mantenciones.

### Puede crear o modificar

- Crear/editar sus tickets propios bajo la regla de `REQUESTER`.
- Corregir excepcionalmente la prioridad con motivo obligatorio.
- Registrar observación final opcional al cerrar.

### Puede ejecutar

- Asignar desde `NEW` y reasignar desde `PENDING_REASSIGNMENT` a técnicos disponibles.
- Aprobar o rechazar congelamientos.
- Marcar el bloqueo resuelto y pasar `FROZEN -> PENDING_REASSIGNMENT`.
- Cerrar administrativamente desde `RESOLVED`.

### Tiene prohibido

- Iniciar o resolver una mantención como técnico.
- Asignar un ticket a un técnico ocupado.
- Cerrar desde un estado distinto de `RESOLVED`.
- Reabrir o modificar tickets `CLOSED`.

## Matriz de permisos

| Acción | `REQUESTER` | `TECHNICIAN` | `ADMIN` | Condición principal |
|---|:---:|:---:|:---:|---|
| Crear ticket | Sí | Sí | Sí | Usuario autenticado; requester derivado de sesión. |
| Ver tickets propios | Sí | Sí | Sí | Propiedad validada en backend. |
| Editar ticket propio | Sí | Sí | Sí | Solo creador y estado `NEW`. |
| Ver todos los tickets | No | No | Sí | Filtrado backend por rol. |
| Ver mantención asignada | No | Sí | Sí | Técnico participante o administrador. |
| Ver historial propio | Sí | Sí | Sí | Alcance según propiedad/participación. |
| Ver historial global | No | No | Sí | Administrador. |
| Asignar técnico | No | No | Sí | Ticket `NEW`; técnico disponible. |
| Reasignar técnico | No | No | Sí | Ticket `PENDING_REASSIGNMENT`; técnico disponible. |
| Ver disponibilidad técnica | No | No | Sí | Disponibilidad derivada. |
| Iniciar mantención | No | Sí | No | Técnico actual; ticket `ASSIGNED`. |
| Registrar diagnóstico/trabajo | No | Sí | No | Técnico actual, según estado/contrato técnico. |
| Solicitar congelamiento | No | Sí | No | Técnico actual; `IN_PROGRESS`; motivo obligatorio. |
| Aprobar/rechazar congelamiento | No | No | Sí | Ticket `FREEZE_REQUESTED`. |
| Marcar bloqueo resuelto | No | No | Sí | Ticket `FROZEN`. |
| Resolver | No | Sí | No | Técnico actual; `IN_PROGRESS`; trabajo realizado obligatorio. |
| Cerrar ticket | No | No | Sí | Ticket `RESOLVED`. |
| Corregir prioridad | No | No | Sí | Motivo obligatorio e historial. |
| Eliminar ticket | No | No | No | No existe borrado físico en el MVP. |
| Reabrir ticket | No | No | No | `CLOSED` es inmutable. |

## Contraste con `AGENTS.md`

La matriz coincide con el Word. `AGENTS.md` precisa el límite de seguridad: el backend NestJS debe derivar actor y rol desde la identidad autenticada, comprobar ownership/current technician y no aceptar campos derivados del cliente como autoridad. No se detectó una contradicción de permisos.
