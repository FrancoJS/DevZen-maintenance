# Criterios de aceptación

No son pruebas implementadas. Los escenarios orientan la futura validación del MVP.

| ID | Criterio | Reglas relacionadas | Escenario sugerido | Resultado esperado | Tipo posible |
|---|---|---|---|---|---|
| `CA-01` | Los tres roles pueden autenticarse y solo reciben acciones autorizadas. | `RN-02`, `RN-05`, `RN-08`, `RN-14`, `RN-18`, `RN-21` | Autenticar un usuario de cada rol e intentar acciones permitidas y prohibidas. | Cada rol accede solo a su información/acciones; backend rechaza accesos indebidos. | Integración, E2E |
| `CA-02` | Un ticket nuevo se persiste con solicitante y timestamp. | `RN-01`, `RN-02`, `RN-15` | Crear ticket autenticado sin enviar requester confiable desde cliente. | Ticket `NEW` con solicitante de sesión y fecha/hora automática. | Integración, E2E |
| `CA-03` | La prioridad coincide con las reglas del cuestionario. | `RN-03`, `RN-04` | Probar casos de cada nivel y precedencias. | Prioridad calculada en orden `CRITICAL -> HIGH -> MEDIUM -> LOW`; respuestas persistidas. | Unit, integración |
| `CA-04` | El solicitante no puede editar después de ser asignado. | `RN-02`, `RN-18` | Creador intenta editar ticket `ASSIGNED`. | Backend rechaza; datos permanecen sin cambio. | Integración, E2E |
| `CA-05` | El administrador no puede asignar un segundo ticket a un técnico ocupado. | `RN-05`, `RN-06`, `RN-07`, `RN-20` | Asignar un ticket y luego intentar asignar otro al mismo técnico. | Segunda operación falla y no deja datos parciales. | Integración |
| `CA-06` | El técnico no puede iniciar un ticket no asignado. | `RN-08`, `RN-18` | Técnico B intenta iniciar ticket de técnico A. | Backend rechaza; estado continúa `ASSIGNED`. | Integración, E2E |
| `CA-07` | Al resolver una mantención, el técnico queda disponible. | `RN-09`, `RN-19` | Técnico actual resuelve desde `IN_PROGRESS`. | Ticket `RESOLVED`, asignación liberada, `currentTechnicianId = null`, técnico disponible. | Integración, E2E |
| `CA-08` | Aprobar congelamiento libera al técnico y conserva trazabilidad previa. | `RN-11`, `RN-15`, `RN-19` | `ADMIN` aprueba solicitud pendiente. | Ticket `FROZEN`, técnico disponible, asignación activa cerrada e historial preservado. | Integración, E2E |
| `CA-09` | Una mantención congelada no puede reiniciarse sin nueva asignación. | `RN-12`, `RN-18` | Intentar iniciar ticket `FROZEN` o `PENDING_REASSIGNMENT`. | Backend rechaza hasta pasar por `ASSIGNED`. | Integración |
| `CA-10` | El administrador puede reasignar a cualquier técnico disponible. | `RN-05`, `RN-13`, `RN-20` | Desde `PENDING_REASSIGNMENT`, elegir técnico original disponible y luego caso con otro técnico. | Ambas alternativas válidas; nueva asignación trazada. | Integración, E2E |
| `CA-11` | Solo un ticket `RESOLVED` puede cerrarse. | `RN-14`, `RN-17`, `RN-18` | Intentar cierre desde distintos estados/roles. | Solo `ADMIN` desde `RESOLVED` obtiene `CLOSED`. | Integración, E2E |
| `CA-12` | El historial refleja creación, asignaciones, estados, congelamientos, resolución y cierre con timestamps. | `RN-01`, `RN-04`, `RN-09`, `RN-11`, `RN-15` | Ejecutar flujo normal y flujo con congelamiento. | Cronología completa con actor, timestamps y detalles relevantes. | Integración, E2E |
| `CA-13` | Mientras el congelamiento está pendiente, el técnico sigue ocupado. | `RN-06`, `RN-07`, `RN-10`, `RN-19` | Solicitar congelamiento e intentar asignar otro ticket al técnico. | Ticket `FREEZE_REQUESTED`; segunda asignación rechazada. | Integración, E2E |
| `CA-14` | Solo el administrador puede pasar `FROZEN` a `PENDING_REASSIGNMENT` al resolver el bloqueo. | `RN-18`, `RN-21` | Técnico y administrador intentan marcar bloqueo resuelto. | Técnico rechazado; administrador produce la transición y el historial. | Integración, E2E |

## Cobertura recomendada por nivel

- **Unit:** prioridad, política de estados, disponibilidad derivada y políticas aisladas de rol/acción.
- **Integración/servicio:** autorización real, asignación, concurrencia, congelamiento, liberación, reasignación, cierre e historial.
- **E2E:** flujo crítico completo y, si se incluye en la demo, flujo de congelamiento/reasignación.
