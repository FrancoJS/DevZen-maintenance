# Visión general del producto

## Problema

Las fallas de maquinaria se reportan por canales informales, como radio o mensajería. Sin un proceso estandarizado, las solicitudes pueden perderse, carecen de priorización y no existe seguimiento confiable de las reparaciones. El sistema centraliza esos reportes y mantiene trazabilidad desde la detección de la falla hasta el cierre administrativo.

## Contexto del hackathon

El desafío LuxNova INACAP 2026 solicita diseñar y demostrar en aproximadamente cinco minutos una solución tecnológica para organizar mantenimiento. El equipo eligió mantenimiento correctivo de maquinarias y documentó reglas adicionales para hacer consistente el MVP.

El PDF oficial exige como base crear, leer y actualizar tickets; registrar descripción, fecha y hora; persistir en base de datos; autenticar tres roles; listar según rol; asignar técnicos y cambiar estados. La especificación funcional aprobada conserva esos mínimos y eleva algunas funciones sugeridas por el desafío a compromisos del MVP del equipo.

## Objetivo del producto

Proveer un flujo único, trazable y demostrable que permita:

- registrar una falla;
- calcular su prioridad según impacto y seguridad;
- asignar un técnico disponible;
- ejecutar y documentar la mantención;
- congelar y reasignar cuando exista un bloqueo;
- resolver técnicamente;
- cerrar administrativamente;
- consultar el historial completo.

## Actores

- `REQUESTER` — Solicitante: reporta fallas y consulta sus tickets.
- `TECHNICIAN` — Técnico: además de actuar como solicitante, ejecuta la mantención que tiene asignada.
- `ADMIN` — Administrador: gestiona tickets, asignaciones, congelamientos, prioridades excepcionales y cierres.

## Obligatorio para el MVP del equipo

- Login y autorización para los tres roles.
- Creación, lectura, listado, detalle y actualización de tickets según rol y estado.
- Persistencia en PostgreSQL.
- Visibilidad de tickets por rol.
- Flujo completo del ticket con estados validados.
- Prioridad automática determinística y explicable.
- Disponibilidad derivada de técnicos y máximo una mantención activa.
- Asignación y reasignación con validación de concurrencia.
- Congelamiento con aprobación o rechazo administrativo.
- Liberación del técnico al aprobar congelamiento o resolver.
- Historial y trazabilidad de acciones relevantes.
- Cierre administrativo solo después de la resolución.

## Valor adicional, solo si se autoriza

- Filtros y búsqueda completos.
- Dashboard administrativo con gráficos simples.
- Tiempo promedio de resolución.
- Evidencia fotográfica inicial o final.
- Métricas por técnico o tipo de máquina.

El dashboard aparece entre las pantallas administrativas de referencia, pero sus agregaciones y gráficos permanecen opcionales según las secciones 13.1 y 14.2 del Word.

## Fuera de alcance

- Integraciones con APIs o sistemas externos.
- Notificaciones por correo, WhatsApp, push o aplicaciones externas.
- Mantenimiento preventivo o predictivo.
- Gestión completa de activos, stock o repuestos.
- Colas de múltiples trabajos activos por técnico.
- Reapertura de tickets cerrados.
- CRUD completo de usuarios cuando basten cuentas precargadas para la demo.
- Priorización mediante IA.
- Mutaciones automáticas de datos de negocio mediante IA.

## Principios funcionales

- Un `Ticket` representa una sola falla y un solo ciclo de vida.
- La trazabilidad prevalece sobre el borrado.
- La autorización se valida en backend; la interfaz solo acompaña la experiencia.
- La disponibilidad del técnico se calcula, no se edita.
- Las reglas deben ser simples, determinísticas y explicables durante el pitch.

