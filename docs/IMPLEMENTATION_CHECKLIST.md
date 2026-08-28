# Checklist de implementación

Los ítems reproducen la sección 16 de la especificación en formato Markdown. Los elementos completados reflejan la implementación disponible; las capacidades de tickets y frontend continúan pendientes.

## Backend / dominio

- [x] Definir enums de roles, prioridad, estados y congelamiento.
- [x] Crear entidades/tablas principales y migraciones.
- [x] Implementar autenticación y guards por rol.
- [x] Exponer documentación OpenAPI de autenticación únicamente en desarrollo.
- [x] Implementar cálculo de prioridad con pruebas unitarias.
- [ ] Implementar máquina de estados del ticket.
- [x] Implementar asignación inicial `NEW -> ASSIGNED`, disponibilidad derivada y protección de capacidad para técnicos.
- [x] Implementar historial automático para creación y edición de tickets.
- [x] Implementar flujo de congelamiento y liberación de asignación.
- [x] Implementar visibilidad por rol, paginación y filtros mínimos de tickets.
- [x] Implementar consulta administrativa paginada de técnicos y consulta de mantención actual del técnico.
- [x] Implementar inicio `ASSIGNED -> IN_PROGRESS` y registro técnico parcial en `IN_PROGRESS`.
- [x] Implementar resolución `IN_PROGRESS -> RESOLVED`, liberación del técnico e historial de mantenciones anteriores.
- [x] Implementar cierre administrativo `RESOLVED -> CLOSED` e inmutabilidad de tickets cerrados.
- [x] Exponer bandeja administrativa de solicitudes de congelamiento y agregaciones administrativas de dashboard.
- [x] Agregar catálogos persistidos de ubicaciones y maquinaria, código público de ticket y restricción de una solicitud no cerrada por maquinaria.
- [ ] Exponer catálogos autenticados, asociación de creación a maquinaria y listado administrativo global.
- [ ] Implementar carga de evidencia final privada y exigirla al resolver.

## Frontend

- [ ] Crear layout y navegación por rol.
- [ ] Crear formulario de solicitud con cinco preguntas de impacto.
- [ ] Mostrar prioridad calculada retornada por backend.
- [ ] Crear listados y detalle reutilizable del ticket.
- [ ] Crear vistas/acciones específicas de técnico.
- [x] Crear gestión administrativa con listado, filtros MVP y disponibilidad técnica integrada.
- [x] Crear detalle administrativo y selector de técnicos disponibles para asignación inicial.
- [ ] Crear flujo de aprobación de congelamiento.
- [ ] Mostrar historial cronológico.
- [ ] Ocultar/deshabilitar acciones inválidas sin depender de ello como única seguridad.

El componente gráfico del dashboard es valor adicional. La gestión administrativa y la selección de técnicos sí forman parte de las capacidades obligatorias.

## Datos de demostración

- [ ] Preparar al menos un usuario por rol.
- [ ] Preparar al menos dos técnicos para demostrar disponible/ocupado.
- [ ] Preparar tickets en distintos estados y prioridades.
- [ ] Preparar un caso de congelamiento aprobado para demostrar reasignación.
- [ ] Preparar un flujo completo `NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`.

## Evidencia actual inspeccionada

- Nx `23.1.1`, Angular `22.0.x`, NestJS `11.x`.
- `apps/web` contiene la bienvenida de Nx y rutas vacías.
- `apps/api` incorpora configuración TypeORM, entidades, migración inicial y seed de usuarios.
- La autenticación JWT, el guard global, la autorización gruesa por roles, `/api/auth/login`, `/api/auth/me` y la documentación OpenAPI de desarrollo están implementados.
- Los tickets implementan creación, listado, detalle, edición propia `NEW`,
  asignación, congelamiento, inicio, registro técnico, resolución y cierre
  administrativo. Administración dispone de bandeja de congelamientos y
  agregaciones de dashboard; la interfaz de esas capacidades continúa fuera de
  esta fase.
- El frontend incorpora gestión administrativa, filtros MVP, disponibilidad técnica, detalle completo y asignación inicial desde `NEW`; el cierre administrativo visual continúa pendiente.
- TypeORM `0.3.31`, PostgreSQL, entidades, migración inicial y seed base están implementados; el ciclo normal está completo.

## Flujo de trabajo por fases

Estas reglas de `AGENTS.md` gobiernan la ejecución futura, no agregan funcionalidades:

1. Inspeccionar fuentes, código y reglas/criterios afectados.
2. Restablecer el alcance de la fase autorizada.
3. Implementar solo esa fase, junto con las pruebas que protegen su comportamiento.
4. Revisar el diff completo por alcance, seguridad, datos sensibles y ruido generado.
5. Ejecutar validación proporcional al cambio: unit para políticas aisladas; integración para reglas backend/persistencia; E2E solo para flujos completos cuando corresponda.
6. Reportar resultado, archivos, validación, impacto de datos, supuestos y bloqueos.
7. Detenerse y esperar aprobación antes de iniciar otra fase.

No corresponde ejecutar suites globales para cambios puramente documentales. Para lógica de negocio futura deben priorizarse las pruebas mínimas que protejan prioridad, transiciones, autorización, asignación, concurrencia, congelamiento, liberación, reasignación, resolución, cierre e historial.
