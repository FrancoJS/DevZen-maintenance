# Checklist de implementación

Los ítems reproducen la sección 16 de la especificación en formato Markdown. Permanecen sin marcar porque la inspección encontró únicamente el scaffold inicial de Angular/NestJS, sin implementación funcional que satisfaga estas reglas.

## Backend / dominio

- [ ] Definir enums de roles, prioridad, estados y congelamiento.
- [ ] Crear entidades/tablas principales y migraciones.
- [ ] Implementar autenticación y guards por rol.
- [ ] Implementar cálculo de prioridad con pruebas unitarias.
- [ ] Implementar máquina de estados del ticket.
- [ ] Implementar regla de máximo un ticket `ASSIGNED`/`IN_PROGRESS`/`FREEZE_REQUESTED` por técnico.
- [ ] Implementar historial automático para cambios relevantes.
- [ ] Implementar flujo de congelamiento y liberación de asignación.
- [ ] Implementar filtros de visibilidad por rol.

## Frontend

- [ ] Crear layout y navegación por rol.
- [ ] Crear formulario de solicitud con cinco preguntas de impacto.
- [ ] Mostrar prioridad calculada retornada por backend.
- [ ] Crear listados y detalle reutilizable del ticket.
- [ ] Crear vistas/acciones específicas de técnico.
- [ ] Crear dashboard/gestión administrativa y selector de técnicos disponibles.
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
- `apps/api` contiene solo `AppModule`, `AppController` y `AppService` con `Hello API`.
- Pruebas unitarias/E2E existentes cubren únicamente el scaffold.
- No se encontraron dependencias ni archivos de ORM, entidades, migraciones, auth, tickets o PostgreSQL.

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
