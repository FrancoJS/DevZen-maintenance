# Pantallas y navegación

Este documento describe propósito, información mínima, acciones y restricciones. No prescribe diseño visual ni componentes. Las funciones opcionales se identifican expresamente.

## Compartidas

### Login

- **Propósito:** autenticar usuarios de los tres roles.
- **Información mínima:** credenciales según contrato pendiente.
- **Acciones:** iniciar sesión.
- **Restricciones:** rol efectivo proviene del backend.

### Crear solicitud

- **Propósito:** reportar una falla.
- **Información mínima:** descripción, área si aplica, ubicación, máquina/equipo y cinco respuestas de impacto; evidencia inicial opcional.
- **Acciones:** enviar solicitud y visualizar prioridad calculada por backend.
- **Restricciones:** usuario autenticado; no elige requester ni prioridad.

### Detalle del ticket

- **Propósito:** consultar solicitud, gestión, mantención, resolución, cierre e historial del mismo ticket.
- **Información mínima:** contenido autorizado por rol y estado.
- **Acciones:** varían según rol/estado.
- **Restricciones:** misma base conceptual; backend controla acceso.

### Historial

- **Propósito:** mostrar cronología trazable.
- **Información mínima:** actor, timestamp, acción, estados y detalle cuando corresponda.
- **Acciones:** consulta.
- **Restricciones:** alcance según propietario, participación o administración.

## Solicitante

### Inicio

- **Propósito:** resumen de tickets propios y acceso a creación.
- **Información mínima:** tickets propios por situación general.
- **Acciones:** abrir listado, crear y consultar detalle.
- **Restricciones:** nunca muestra tickets ajenos.

### Mis solicitudes

- **Propósito:** listar tickets propios.
- **Información mínima:** estado, prioridad, máquina y fecha.
- **Acciones:** abrir detalle; búsqueda/filtros básicos aparecen en la pantalla del Word, pero los filtros completos son valor adicional.
- **Restricciones:** filtrado efectivo en backend.

### Editar solicitud

- **Propósito:** corregir datos permitidos de una solicitud propia.
- **Información mínima:** campos editables, todavía pendientes de definición exacta.
- **Acciones:** guardar cambios.
- **Restricciones:** solo creador y estado `NEW`.

## Técnico

### Inicio

- **Propósito:** visualizar disponibilidad personal y trabajo actual.
- **Información mínima:** `AVAILABLE`/`BUSY`, mantención asignada y resumen de historial.
- **Acciones:** abrir mantención o historial.
- **Restricciones:** disponibilidad derivada, no editable.

### Mi mantención

- **Propósito:** ejecutar el ticket actualmente asignado.
- **Información mínima:** solicitud original, estado, datos técnicos e historial relevante.
- **Acciones:** iniciar desde `ASSIGNED`; registrar información; solicitar congelamiento o resolver desde `IN_PROGRESS`.
- **Restricciones:** solo técnico actual; ninguna acción sobre tickets ajenos.

### Historial de mantenciones

- **Propósito:** consultar trabajos en los que participó.
- **Información mínima:** tickets resueltos/cerrados, participación y estados relevantes.
- **Acciones:** abrir detalle.
- **Restricciones:** historial personal, no global.

### Detalle de mantención

- **Propósito:** ver solicitud, información técnica y cambios/asignaciones.
- **Información mínima:** datos autorizados del ticket y participación.
- **Acciones:** según estado y condición de técnico actual.
- **Restricciones:** no habilitar acciones técnicas si ya no es el asignado.

### Mis solicitudes

- **Propósito:** gestionar tickets creados por el técnico como solicitante.
- **Información/acciones/restricciones:** las mismas reglas del rol `REQUESTER`.

## Administrador

### Dashboard

- **Propósito:** resumen operativo.
- **Información mínima si se implementa:** totales por estado/prioridad, críticos y sin asignar; gráficos y tiempo promedio son opcionales.
- **Acciones:** consulta/navegación a tickets.
- **Restricciones:** no tratar métricas opcionales como bloqueo del MVP.

### Gestión de tickets

- **Propósito:** listar y gestionar todos los tickets.
- **Información mínima:** estado, prioridad, máquina, solicitante y técnico actual cuando exista.
- **Acciones:** abrir detalle y acciones administrativas permitidas.
- **Restricciones:** filtros completos son valor adicional.

### Detalle completo

- **Propósito:** consultar solicitud, mantención, asignaciones, congelamientos, resolución, historial y cierre.
- **Acciones:** corregir prioridad con motivo; asignar/reasignar; decidir congelamiento; marcar bloqueo resuelto; cerrar desde `RESOLVED`.
- **Restricciones:** cada acción depende del estado; `CLOSED` solo lectura.

### Técnicos

- **Propósito:** visualizar disponibilidad y ticket actual.
- **Información mínima:** técnico, `AVAILABLE`/`BUSY` y ticket activo cuando corresponda.
- **Acciones:** consulta; acceso a asignación cuando proceda.
- **Restricciones:** sin edición manual de disponibilidad.

### Asignación

- **Propósito:** asignar desde `NEW` o `PENDING_REASSIGNMENT`.
- **Información mínima:** ticket y técnicos con disponibilidad derivada.
- **Acciones:** seleccionar técnico disponible y confirmar.
- **Restricciones:** ocupados no seleccionables; backend revalida concurrencia.

### Congelamientos

- **Propósito:** revisar solicitudes pendientes.
- **Información mínima:** ticket, técnico, motivo, detalle y fecha/hora.
- **Acciones:** aprobar/rechazar; en tickets `FROZEN`, marcar bloqueo resuelto desde el detalle/flujo definido.
- **Restricciones:** solo `ADMIN`; aprobación libera técnico, rechazo no.

### Historial de mantenciones

- **Propósito:** consulta global de trabajos y responsables.
- **Información mínima:** ticket, participantes, estados y timestamps.
- **Acciones:** abrir detalle.
- **Restricciones:** exclusivo administrativo.

## Reglas transversales de UX

- No comunicar estado o prioridad solo mediante color.
- Mostrar estados de carga, vacío, error, deshabilitado y éxito para flujos implementados.
- Ocultar/deshabilitar acciones inválidas sin confundirlo con autorización real.
- No sugerir edición, eliminación ni reapertura de tickets `CLOSED`.
