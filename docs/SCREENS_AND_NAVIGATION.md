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
- **Acceso:** modal desde **Mis solicitudes**. Las rutas históricas de creación redirigen a esa pantalla con el modal abierto.
- **Información mínima:** código de máquina/equipo, ubicación y ficha técnica derivados de la máquina, descripción y cinco respuestas de impacto; evidencia inicial opcional.
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
- **Acciones:** crear desde un modal, abrir detalle y editar la descripción cuando el ticket propio esté en estado `NEW`; búsqueda/filtros básicos aparecen en la pantalla del Word, pero los filtros completos son valor adicional.
- **Restricciones:** filtrado efectivo en backend.

### Editar solicitud

- **Propósito:** corregir la descripción de una solicitud propia.
- **Información mínima:** descripción actual, obligatoria y de hasta 1.000 caracteres.
- **Acciones:** guardar cambios.
- **Restricciones:** solo creador y estado `NEW`; no modifica equipo, ubicación, impacto, prioridad, estado ni requester.

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

- **Propósito:** listar y gestionar todos los tickets y consultar la capacidad técnica necesaria para asignarlos.
- **Información mínima:** estado, prioridad, máquina, solicitante, técnico actual cuando exista y resumen de técnicos `AVAILABLE`/`BUSY`.
- **Acciones:** abrir detalle y acciones administrativas permitidas.
- **Restricciones:** los filtros disponibles en el MVP son estado, prioridad y disponibilidad/asignación; filtros completos son valor adicional. Se aplican a tickets y técnicos según el ticket activo de cada técnico. La disponibilidad es derivada y no editable. La vista se organiza en dos secciones desplegables independientes, inicialmente cerradas, con transición de apertura y cierre.

### Mis solicitudes

- **Propósito:** consultar y gestionar los tickets creados por el administrador como solicitante.
- **Información/acciones/restricciones:** las mismas reglas del rol `REQUESTER`; esta pantalla no reemplaza Gestión de tickets ni el historial global.

### Detalle completo

- **Propósito:** consultar solicitud, mantención, asignaciones, congelamientos, resolución, historial y cierre.
- **Acciones:** corregir prioridad con motivo; asignar/reasignar; decidir congelamiento; marcar bloqueo resuelto; cerrar desde `RESOLVED`.
- **Restricciones:** cada acción depende del estado; `CLOSED` solo lectura.

### Asignación

- **Propósito:** asignar desde `NEW` o `PENDING_REASSIGNMENT`.
- **Información mínima:** ticket y técnicos con disponibilidad derivada.
- **Acciones:** seleccionar técnico disponible y confirmar.
- **Restricciones:** ocupados no seleccionables; backend revalida concurrencia.

La selección y consulta de técnicos forma parte de Gestión de tickets; no existe una pantalla administrativa independiente de técnicos.

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
