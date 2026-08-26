# Reglas de negocio

Registro fiel de `RN-01` a `RN-21`. “Capa responsable” identifica dónde debe residir la validación; no fija una arquitectura todavía inexistente.

## `RN-01` — Identidad única del ticket

- **Regla:** Un ticket corresponde a una sola falla reportada y conserva el mismo ID durante todo el ciclo.
- **Interpretación operativa:** solicitud, mantención, resolución y cierre actualizan el mismo ticket.
- **Capa responsable:** dominio/persistencia.
- **Frontend:** reutilizar el detalle del mismo ID durante el ciclo.
- **Backend:** impedir la fragmentación del ciclo en tickets desconectados.
- **Prueba sugerida:** integración del flujo completo verificando identidad estable.

## `RN-02` — Edición por el creador

- **Regla:** Solo el creador puede editar la solicitud y únicamente mientras el estado sea `NEW`.
- **Interpretación operativa:** deben cumplirse simultáneamente ownership y estado.
- **Capa responsable:** autorización y servicio de tickets.
- **Frontend:** mostrar edición solo para ticket propio `NEW`.
- **Backend:** derivar creador desde identidad y rechazar cualquier otro caso.
- **Prueba sugerida:** integración; cubre `CA-04`.

## `RN-03` — Prioridad automática

- **Regla:** La prioridad se calcula automáticamente a partir del cuestionario de impacto.
- **Interpretación operativa:** el usuario aporta cinco respuestas, no una prioridad.
- **Capa responsable:** servicio/política de prioridad.
- **Frontend:** enviar respuestas y mostrar resultado del backend.
- **Backend:** calcular, persistir respuestas y prioridad.
- **Prueba sugerida:** unit para algoritmo e integración de creación; cubre `CA-03`.

## `RN-04` — Corrección excepcional de prioridad

- **Regla:** El administrador puede corregir la prioridad solo con motivo obligatorio.
- **Interpretación operativa:** solo `ADMIN`; se conservan valor anterior, nuevo valor, motivo, actor y timestamp.
- **Capa responsable:** autorización, servicio de tickets e historial.
- **Frontend:** acción administrativa con motivo requerido.
- **Backend:** validar rol/motivo y registrar el cambio atómicamente.
- **Prueba sugerida:** integración de autorización, motivo y auditoría.

## `RN-05` — Asignación administrativa

- **Regla:** Solo el administrador asigna o reasigna técnicos.
- **Interpretación operativa:** ningún técnico puede autoasignarse.
- **Capa responsable:** autorización y servicio de asignaciones.
- **Frontend:** controles solo para `ADMIN`.
- **Backend:** validar rol y precondiciones del ticket/técnico.
- **Prueba sugerida:** integración por roles.

## `RN-06` — Capacidad máxima

- **Regla:** Un técnico puede tener máximo una mantención `ASSIGNED`, `IN_PROGRESS` o `FREEZE_REQUESTED`.
- **Interpretación operativa:** cualquiera de esos estados consume toda su capacidad.
- **Capa responsable:** dominio de disponibilidad y persistencia.
- **Frontend:** representar al técnico como ocupado.
- **Backend:** impedir una segunda mantención activa.
- **Prueba sugerida:** unit de disponibilidad e integración; cubre `CA-05`, `CA-13`.

## `RN-07` — Técnico ocupado no asignable

- **Regla:** Un técnico ocupado no puede recibir otra asignación.
- **Interpretación operativa:** la lista visual no reemplaza la comprobación al escribir.
- **Capa responsable:** servicio transaccional de asignación.
- **Frontend:** no ofrecerlo como opción válida.
- **Backend:** rechazar si dejó de estar disponible.
- **Prueba sugerida:** integración con técnico ocupado; cubre `CA-05`.

## `RN-08` — Propiedad de acciones técnicas

- **Regla:** Solo el técnico actualmente asignado puede iniciar, registrar trabajo, solicitar congelamiento o resolver esa mantención.
- **Interpretación operativa:** rol `TECHNICIAN` no basta; la identidad debe coincidir con `currentTechnicianId`.
- **Capa responsable:** autorización y servicio de mantención.
- **Frontend:** mostrar acciones únicamente al técnico actual.
- **Backend:** validar identidad y estado para cada acción.
- **Prueba sugerida:** integración con técnico asignado y no asignado; cubre `CA-06`.

## `RN-09` — Liberación al resolver

- **Regla:** Al resolver, se cierra la asignación activa, `currentTechnicianId` queda nulo, se conserva el historial y el técnico queda disponible aunque el ticket todavía no esté cerrado.
- **Interpretación operativa:** resolución técnica y cierre administrativo son pasos distintos.
- **Capa responsable:** transacción de resolución.
- **Frontend:** mostrar ticket `RESOLVED` y técnico disponible.
- **Backend:** actualizar ticket/asignación e historial de forma atómica.
- **Prueba sugerida:** integración; cubre `CA-07`.

## `RN-10` — Origen del congelamiento

- **Regla:** Solo se puede solicitar congelamiento desde `IN_PROGRESS`.
- **Interpretación operativa:** además aplica `RN-08` y motivo obligatorio.
- **Capa responsable:** política de transición y mantención.
- **Frontend:** habilitar acción solo en `IN_PROGRESS` para técnico actual.
- **Backend:** rechazar otros estados o actores.
- **Prueba sugerida:** integración de estados válidos/ inválidos.

## `RN-11` — Liberación al aprobar congelamiento

- **Regla:** Al aprobar congelamiento, se libera al técnico y la asignación activa queda nula; la asignación histórica se conserva.
- **Interpretación operativa:** ticket `FROZEN`, `currentTechnicianId = null`, técnico disponible.
- **Capa responsable:** transacción de decisión de congelamiento.
- **Frontend:** reflejar liberación inmediata y trazabilidad previa.
- **Backend:** cambiar estado, cerrar vínculo activo y registrar historial atómicamente.
- **Prueba sugerida:** integración; cubre `CA-08`.

## `RN-12` — Reasignación antes de reiniciar

- **Regla:** Una mantención congelada debe ser reasignada antes de volver a iniciar.
- **Interpretación operativa:** no existe `FROZEN -> IN_PROGRESS`.
- **Capa responsable:** máquina de estados y asignación.
- **Frontend:** no ofrecer “Iniciar” mientras esté `FROZEN` o `PENDING_REASSIGNMENT`.
- **Backend:** exigir el paso por `ASSIGNED`.
- **Prueba sugerida:** integración; cubre `CA-09`.

## `RN-13` — Destino de reasignación

- **Regla:** Una reasignación puede recaer en el técnico original o en otro técnico, siempre que esté disponible.
- **Interpretación operativa:** no existe preferencia obligatoria por el técnico anterior.
- **Capa responsable:** servicio de asignación.
- **Frontend:** listar técnicos disponibles sin excluir al original.
- **Backend:** validar disponibilidad al escribir.
- **Prueba sugerida:** integración de ambas alternativas; cubre `CA-10`.

## `RN-14` — Cierre administrativo

- **Regla:** Solo el administrador puede cerrar un ticket y solo si está `RESOLVED`.
- **Interpretación operativa:** cierre es una transición separada y posterior a la resolución.
- **Capa responsable:** autorización y máquina de estados.
- **Frontend:** acción solo para `ADMIN` en `RESOLVED`.
- **Backend:** rechazar otros roles/estados.
- **Prueba sugerida:** integración; cubre `CA-11`.

## `RN-15` — Auditoría

- **Regla:** Cada cambio relevante registra actor y timestamp.
- **Interpretación operativa:** cuando hay transición también se conservan estado anterior/nuevo y detalle pertinente.
- **Capa responsable:** servicios de dominio e historial.
- **Frontend:** mostrar cronología autorizada.
- **Backend:** registrar junto con la acción de negocio.
- **Prueba sugerida:** integración del flujo completo; cubre `CA-12`.

## `RN-16` — Sin eliminación física

- **Regla:** Los tickets no se eliminan físicamente en el MVP.
- **Interpretación operativa:** no existe acción ni endpoint de hard delete.
- **Capa responsable:** contratos, dominio y persistencia.
- **Frontend:** no mostrar eliminar.
- **Backend:** no exponer borrado físico.
- **Prueba sugerida:** revisión de contrato/rutas y autorización.

## `RN-17` — Inmutabilidad del cierre

- **Regla:** Un ticket `CLOSED` no puede modificarse ni reabrirse en el MVP.
- **Interpretación operativa:** no tiene transiciones ni edición de datos funcionales.
- **Capa responsable:** política de transición y servicios de escritura.
- **Frontend:** vista de solo lectura sin reapertura.
- **Backend:** rechazar toda mutación no contemplada.
- **Prueba sugerida:** integración de intentos de edición/transición.

## `RN-18` — Autorización en backend

- **Regla:** Las autorizaciones de rol deben validarse en backend, no solo ocultando botones en frontend.
- **Interpretación operativa:** actor/rol provienen de la identidad autenticada.
- **Capa responsable:** guards/políticas y servicios NestJS.
- **Frontend:** adaptar UX sin asumirse como barrera de seguridad.
- **Backend:** comprobar rol, ownership, técnico actual y estado.
- **Prueba sugerida:** integración por actor no autorizado; cubre `CA-01`.

## `RN-19` — Disponibilidad derivada

- **Regla:** La disponibilidad del técnico es derivada; no puede cambiarse manualmente.
- **Interpretación operativa:** se calcula por existencia de mantenciones activas.
- **Capa responsable:** consulta/política de disponibilidad.
- **Frontend:** mostrarla como lectura, sin edición.
- **Backend:** no aceptar un flag manual como fuente de verdad.
- **Prueba sugerida:** unit por estado e integración tras liberar.

## `RN-20` — Protección ante concurrencia

- **Regla:** Si dos operaciones compiten por el mismo técnico disponible, el backend debe impedir que quede asignado a dos tickets.
- **Interpretación operativa:** la comprobación y escritura requieren protección transaccional o restricción equivalente.
- **Capa responsable:** persistencia/servicio de asignación.
- **Frontend:** manejar el rechazo por disponibilidad desactualizada.
- **Backend:** garantizar que solo una operación confirme.
- **Prueba sugerida:** integración concurrente con PostgreSQL cuando exista ORM.

## `RN-21` — Bloqueo resuelto

- **Regla:** Solo el administrador puede marcar una mantención `FROZEN` como lista para retomar; la transición resultante es `PENDING_REASSIGNMENT`.
- **Interpretación operativa:** no asigna ni inicia automáticamente.
- **Capa responsable:** autorización y máquina de estados.
- **Frontend:** acción administrativa en `FROZEN` seguida de asignación separada.
- **Backend:** validar actor/estado y registrar transición.
- **Prueba sugerida:** integración; cubre `CA-14`.

