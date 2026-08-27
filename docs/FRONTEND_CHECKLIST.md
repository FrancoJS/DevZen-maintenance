# Checklist de frontend

Fuente funcional: `Especificacion_Funcional_Sistema_Tickets_Mantenimiento.docx`.

Este checklist organiza el frontend del MVP por dependencias. Una tarea se considera terminada cuando incluye interfaz, estados de carga/error/vacío, restricciones visuales por rol y pruebas proporcionales al riesgo.

## 0. Base del frontend (P0)

- [x] Eliminar la pantalla de bienvenida de Nx.
- [ ] Definir las rutas públicas y privadas de la aplicación.
- [ ] Crear modelos TypeScript para usuario, rol, ticket, prioridad, estado, evaluación de impacto, mantención, congelamiento e historial.
- [x] Crear servicio de sesión y representación del usuario autenticado.
- [x] Implementar protección de rutas por autenticación y rol.
- [x] Crear layout responsive compartido: encabezado, navegación lateral/superior, contenido y cierre de sesión.
- [x] Definir navegación visible para Solicitante, Técnico y Administrador.
- [x] Crear componentes visuales compartidos para estado, prioridad, disponibilidad y mensajes.
- [ ] Definir estados comunes de carga, error, sin datos y acción en progreso.

## 1. Pantallas compartidas (P0)

- [ ] Inicio de sesión.
- [ ] Formulario para crear una solicitud.
  - [ ] Descripción de la falla.
  - [ ] Área.
  - [ ] Ubicación.
  - [ ] Máquina o equipo.
  - [ ] Riesgo para la seguridad: Sí/No.
  - [ ] Detención del equipo: Sí/Parcialmente/No.
  - [ ] Impacto productivo: Detiene/Reduce/No afecta.
  - [ ] Alternativa temporal: Sí/No.
  - [ ] Afecta otros equipos o áreas: Sí/No.
  - [ ] Mostrar la prioridad calculada que devuelve el backend.
- [ ] Detalle reutilizable del ticket con secciones Solicitud, Mantención, Cierre e Historial.
- [ ] Línea de tiempo cronológica del historial.
- [ ] Acceso denegado y página no encontrada.

## 2. Solicitante (P0)

- [ ] Inicio con resumen de tickets propios y acceso rápido a Crear solicitud.
- [x] Mis solicitudes con estado, prioridad, máquina y fecha.
- [x] Búsqueda y filtros básicos.
- [ ] Detalle de una solicitud propia.
- [ ] Editar una solicitud propia solo cuando está en estado `NEW`.
- [ ] Ocultar o deshabilitar acciones no permitidas para el rol.

## 3. Técnico (P0)

- [ ] Inicio con estado personal Disponible/Ocupado y mantención actual.
- [ ] Mi mantención con la información de la solicitud original.
- [ ] Acción para iniciar una mantención `ASSIGNED`.
- [ ] Formulario para registrar diagnóstico, trabajo realizado y observaciones.
- [ ] Acción para solicitar congelamiento desde `IN_PROGRESS`.
  - [ ] Motivo predefinido.
  - [ ] Detalle obligatorio cuando el motivo es Otro.
- [ ] Acción para resolver, exigiendo trabajo realizado.
- [ ] Historial de mantenciones en las que participó.
- [ ] Mis solicitudes, con las mismas reglas del Solicitante.
- [ ] Impedir visualmente acciones sobre tickets que no tiene asignados.

## 4. Administrador (P0)

- [ ] Gestión de todos los tickets.
- [ ] Filtros por fecha, estado, prioridad, área, máquina y técnico.
- [ ] Detalle completo del ticket.
- [ ] Listado de técnicos con estado Disponible/Ocupado y ticket actual.
- [ ] Asignar tickets `NEW` a técnicos disponibles.
- [ ] Reasignar tickets `PENDING_REASSIGNMENT` a técnicos disponibles.
- [ ] Mostrar técnicos ocupados como no seleccionables o filtrarlos.
- [ ] Bandeja de solicitudes de congelamiento pendientes.
- [ ] Aprobar congelamiento.
- [ ] Rechazar congelamiento.
- [ ] Marcar un ticket `FROZEN` como listo para retomar.
- [ ] Cerrar administrativamente un ticket `RESOLVED`.
- [ ] Historial global de mantenciones.

## 5. Reglas visuales y estados (P0)

- [ ] Representar los estados `NEW`, `ASSIGNED`, `IN_PROGRESS`, `FREEZE_REQUESTED`, `FROZEN`, `PENDING_REASSIGNMENT`, `RESOLVED` y `CLOSED`.
- [ ] Representar las prioridades `LOW`, `MEDIUM`, `HIGH` y `CRITICAL` sin depender solamente del color.
- [ ] Mostrar acciones según la combinación de rol, propiedad del ticket, técnico asignado y estado actual.
- [ ] Volver a consultar datos después de cada transición para reflejar el estado confirmado por backend.
- [ ] Mostrar mensajes claros cuando una operación sea rechazada por concurrencia o cambio de estado.
- [ ] Tratar un ticket `CLOSED` como solo lectura.
- [ ] No usar el ocultamiento de botones como mecanismo de seguridad; el backend sigue siendo la autoridad.

## 6. Valor adicional (P1)

- [ ] Dashboard administrativo con totales por estado y prioridad.
- [ ] Resaltar tickets críticos y sin asignar.
- [ ] Gráficos simples.
- [ ] Tiempo promedio de resolución.
- [ ] Evidencia fotográfica inicial y final.
- [ ] Métricas por técnico o tipo de máquina.

## 7. Calidad y demostración (P0)

- [x] Diseño responsive para escritorio y móvil.
- [x] Navegación completa mediante teclado y foco visible.
- [ ] Etiquetas accesibles y mensajes de validación asociados a los campos.
- [ ] Pruebas unitarias de visibilidad de acciones por rol/estado.
- [ ] Pruebas de formularios y validaciones críticas.
- [ ] Pruebas E2E del flujo `NEW → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED`.
- [ ] Prueba E2E del flujo de congelamiento, liberación y reasignación.
- [ ] Datos de demostración: un usuario por rol, dos técnicos y tickets en distintos estados/prioridades.

## Orden de implementación sugerido

1. Base del frontend.
2. Login y formulario de creación.
3. Listado y detalle reutilizable.
4. Flujo normal Solicitante → Administrador → Técnico → Administrador.
5. Congelamiento y reasignación.
6. Historial y filtros.
7. Dashboard y funcionalidades P1.
