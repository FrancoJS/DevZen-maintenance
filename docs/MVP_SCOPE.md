# Alcance del MVP

## Dentro del MVP — sección 14.1

- Login y control de roles.
- Crear, listar, ver detalle y actualizar solicitudes dentro de las reglas.
- Visualización de tickets por rol.
- Asignación y reasignación de técnico.
- Flujo completo de estados.
- Prioridad automática.
- Disponibilidad de técnicos.
- Congelamiento con aprobación administrativa.
- Historial y trazabilidad.
- Persistencia PostgreSQL.

Además, las reglas del mismo Word exigen resolución técnica, liberación de asignación y cierre administrativo como partes del flujo completo.

## Valor adicional — sección 14.2

- Filtros y búsqueda completos.
- Dashboard administrador con gráficos simples.
- Tiempo promedio de resolución.
- Evidencia fotográfica inicial/final.
- Métricas por técnico o tipo de máquina.

Estos elementos no deben convertirse en requisitos obligatorios sin autorización explícita.

## Fuera de alcance — sección 14.3

- Integraciones con APIs o sistemas externos.
- Notificaciones por correo, WhatsApp o aplicaciones externas.
- Mantenimiento preventivo o predictivo.
- Gestión completa de activos, stock o repuestos.
- Colas de múltiples trabajos asignados por técnico.
- Reapertura de tickets cerrados.
- CRUD completo de usuarios si no es necesario para la demo; pueden utilizarse cuentas precargadas.
- Algoritmos de IA para priorización; el resultado es determinístico y explicable.

`AGENTS.md` precisa, sin contradecir el Word, que tampoco se debe implementar mutación automática de datos de negocio por IA, notificaciones push ni funcionalidades empresariales equivalentes no autorizadas.

## Contraste con los Must Have del desafío oficial

| Must Have oficial | Cobertura en el MVP del equipo |
|---|---|
| CRUD de solicitudes/tickets: crear, leer y actualizar | Creación, listado, detalle y actualización según ownership/estado. El borrado no es requerido por el PDF y está prohibido por `RN-16`. |
| Levantamiento por usuario, técnico o administrador | Los tres roles autenticados pueden crear como solicitantes. |
| Descripción, fecha y hora | Descripción obligatoria; timestamp automático. |
| Guardado en base de datos | Persistencia PostgreSQL. |
| Listar o visualizar solicitudes | Listados propios, técnicos y globales según rol. |
| Usuarios y login sencillo con tres roles | `REQUESTER`, `TECHNICIAN`, `ADMIN`. |
| Listado/visualización por rol | Visibilidad filtrada en backend. |
| Asignación a técnico | Asignación/reasignación administrativa a técnico disponible. |
| Cambio de estado | Máquina completa con transiciones autorizadas. |

Todos los Must Have del PDF quedan cubiertos conceptualmente por la especificación funcional.

## Diferencia deliberada respecto del PDF

El PDF clasifica priorización, filtros, historial y dashboard como “Suggested Features”. La especificación funcional posterior del equipo eleva **prioridad automática** e **historial/trazabilidad** al MVP obligatorio, mantiene filtros completos y dashboard/gráficos como valor adicional, y agrega reglas acordadas de capacidad, congelamiento y reasignación. Dada la precedencia aprobada, esto es una ampliación consciente del MVP del equipo y no una contradicción a resolver.

El PDF indica que la documentación no es necesaria para la presentación; no prohíbe crearla ni la convierte en funcionalidad del producto.

