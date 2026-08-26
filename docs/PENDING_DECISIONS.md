# Decisiones y contratos pendientes

No se detectaron contradicciones funcionales entre el Word y `AGENTS.md`. Las entradas siguientes registran únicamente ambigüedades reales o decisiones técnicas necesarias que las fuentes no resuelven.

## `PD-001` — ORM y esquema PostgreSQL

- **Contexto:** PostgreSQL es obligatorio, pero el repositorio no incluye ORM, esquema ni migraciones.
- **Fuentes:** Word, secciones 12 y 14.1; `AGENTS.md`, Backend architecture y Database operations.
- **Decisión requerida:** elegir el ORM/librería y diseñar esquema/migraciones conservando las restricciones funcionales.
- **Impacto:** entidades físicas, transacciones, consultas, migraciones y pruebas de integración.
- **Opciones conocidas:** no están aprobadas; deben evaluarse según el stack antes de implementar.

## `PD-002` — Estrategia de autenticación

- **Contexto:** el Word menciona “sesión/JWT”, sin seleccionar una estrategia; el repositorio no implementa auth.
- **Fuentes:** Word 13.1 y 13.2; `AGENTS.md`, Backend architecture y Security.
- **Decisión requerida:** definir sesión o JWT, flujo de usuario actual y almacenamiento seguro de credenciales.
- **Impacto:** guards, contratos frontend/backend, pruebas y demo accounts.
- **Opciones conocidas:** sesión o JWT.

## `PD-003` — Endpoints y DTOs exactos

- **Contexto:** solo `POST /auth/login` está escrito explícitamente. El resto son responsabilidades funcionales.
- **Fuentes:** Word 13.1; [API_CONTRACTS.md](API_CONTRACTS.md).
- **Decisión requerida:** definir rutas, métodos, DTOs, respuestas y errores sin alterar roles/estados.
- **Impacto:** integración frontend/backend, pruebas y documentación de API.
- **Opciones conocidas:** no aprobadas; evitar inventar una API antes de la decisión.

## `PD-004` — Campos editables del ticket `NEW`

- **Contexto:** `RN-02` permite editar la solicitud propia en `NEW`, pero no enumera qué campos pueden cambiarse ni cómo repercute en la prioridad.
- **Fuentes:** Word 3.1, 9.1, `RN-02`, `RN-03` y 13.1.
- **Decisión requerida:** definir campos editables y si un cambio en respuestas recalcula prioridad y genera qué historial.
- **Impacto:** DTO de edición, prioridad, auditoría y formulario.
- **Opciones conocidas:** no especificadas.

## `PD-005` — Contrato de edición de información técnica

- **Contexto:** el técnico puede registrar diagnóstico/trabajo/observaciones, pero el Word no determina todos los estados permitidos para guardados parciales. Solo fija `IN_PROGRESS` para resolver/congelar y `workPerformed` obligatorio al resolver.
- **Fuentes:** Word 3.2, 9.3, `RN-08` y 13.1; `AGENTS.md`, Resolution.
- **Decisión requerida:** definir cuándo puede guardar cada campo y si `diagnosis` es obligatorio antes de resolver.
- **Impacto:** DTOs, validación, UX y pruebas.
- **Opciones conocidas:** no especificadas.

## `PD-006` — Condición de obligatoriedad de área

- **Contexto:** el Word indica “Área obligatoria si aplica al contexto elegido”, pero no define los contextos.
- **Fuentes:** Word 9.1.
- **Decisión requerida:** definir cuándo `area` es obligatoria y el catálogo/formato aplicable.
- **Impacto:** formulario, DTO, esquema y validación.
- **Opciones conocidas:** texto libre o catálogo no están aprobados.

## `PD-007` — Motivo de rechazo de congelamiento

- **Contexto:** el motivo es obligatorio para solicitar, pero no se declara si el administrador debe motivar un rechazo.
- **Fuentes:** Word 8.1, 8.2 y modelo `FreezeRequest`; `AGENTS.md`, Freeze workflow.
- **Decisión requerida:** determinar obligatoriedad y formato del detalle de rechazo.
- **Impacto:** DTO, historial, pantalla administrativa y pruebas.
- **Opciones conocidas:** opcional u obligatorio; ninguna aprobada.

## `PD-008` — Límite entre dashboard obligatorio y opcional

- **Contexto:** el Word lista Dashboard como pantalla administrativa requerida, mientras 13.1 y 14.2 dejan agregaciones, gráficos y tiempo promedio condicionados al tiempo disponible.
- **Fuentes:** Word 10.4, 13.1 y 14.2; `AGENTS.md`, Minimum screens y Optional.
- **Decisión requerida:** confirmar si el MVP necesita una pantalla resumen mínima sin gráficos o si todo el dashboard se posterga.
- **Impacto:** navegación, alcance frontend/backend y demo.
- **Opciones conocidas:** resumen administrativo mínimo; dashboard completo opcional; postergación total.

## `PD-009` — Alcance de filtros básicos frente a completos

- **Contexto:** “Mis solicitudes” menciona búsqueda/filtros básicos, mientras filtros y búsqueda completos son valor adicional.
- **Fuentes:** Word 10.2 y 14.2; `AGENTS.md`, Optional.
- **Decisión requerida:** definir si el MVP incluye algún filtro mínimo y cuál.
- **Impacto:** consultas, UI, criterios de aceptación y tiempo de implementación.
- **Opciones conocidas:** sin filtros; filtro mínimo por definir; filtros completos opcionales.

## `PD-010` — Protección concreta de concurrencia

- **Contexto:** `RN-20` exige que solo una asignación concurrente gane, pero el mecanismo depende del ORM/esquema.
- **Fuentes:** Word 7.2, `RN-20` y 13.2; `AGENTS.md`, Assignment and concurrency.
- **Decisión requerida:** elegir transacción, bloqueo, restricción única o mecanismo equivalente tras definir el ORM.
- **Impacto:** integridad de datos y prueba concurrente.
- **Opciones conocidas:** las enumeradas por las fuentes, sin selección aprobada.

## `PD-011` — Contratos de listados e historial

- **Contexto:** se requieren listados e historial, pero no se definen paginación, orden, límites ni formato de eventos.
- **Fuentes:** Word 10 y 13.1; `AGENTS.md`, Performance y History.
- **Decisión requerida:** definir contrato mínimo de consulta y representación de eventos.
- **Impacto:** API, rendimiento, frontend y pruebas.
- **Opciones conocidas:** no especificadas; la cronología debe preservar actor/timestamp y detalles relevantes.

## Diferencias documentales ya resueltas por precedencia

No requieren decisión pendiente:

- El PDF oficial trata prioridad e historial como valor adicional; el Word posterior los incorpora al MVP obligatorio del equipo.
- El PDF permite elegir tipo de mantenimiento; el Word fija mantenimiento correctivo.
- El PDF no exige documentación para la presentación; la tarea actual sí la solicita expresamente.

Estas diferencias representan decisiones posteriores respaldadas por la fuente de mayor precedencia, no conflictos ocultos.
