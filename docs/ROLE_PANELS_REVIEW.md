# Revisión del flujo y paneles por rol

Fecha: 28 de agosto de 2026.

## Resultado de la fase

Se implementó la fase solicitada de navegación por rol, disponibilidad técnica y KPI administrativos, sin modificar backend ni persistencia. No se certifica todavía el flujo completo de extremo a extremo: existen pruebas previas desactualizadas y una operación funcional sin contrato aprobado.

| Rol | Pantalla inicial | Qué puede mostrar en la demo |
| --- | --- | --- |
| Solicitante | Mis solicitudes | Crear una falla, consultar prioridad/estado e historial, editar la descripción propia solamente en `NEW`. Sin panel de control. |
| Técnico | Mi mantención | Ticket actual, solicitud original, prioridad, información técnica, iniciar, solicitar congelamiento y resolver. Sidebar con disponibilidad de solo lectura y acceso a solicitudes propias e historial. |
| Administrador | Panel de control | KPI reales, capacidad técnica, pendientes de asignación, congelamiento, reasignación y cierre. Acceso a Gestión de tickets e historial global. |

### KPI administrativos

Se consume exclusivamente `GET /api/dashboard/admin`, sin reconstruir agregaciones desde listas paginadas:

- Tickets: total (incluye cerrados), nuevos, críticos activos (excluye resueltos/cerrados), en proceso y congelados.
- Técnicos: total, disponibles y ocupados.
- Requiere atención: por asignar, congelamientos por aprobar, por reasignar y por cerrar.
- Carga, error/reintento, cero registros y actualización manual. No hay cifras de demostración, gráficos ni tiempo promedio de resolución.

Gestión de tickets ahora consulta `GET /api/tickets/admin`; antes consultaba el endpoint de solicitudes propias. Mis solicitudes conserva `GET /api/tickets`.

### Disponibilidad técnica

El badge usa el contrato de mantención actual: un ticket presente significa ocupado; `ticket: null`, disponible. Un error produce “Sin confirmar”, nunca una disponibilidad falsa. Se comparte la consulta en curso entre sidebar y mantención; no se conserva una caché de tickets completados.

Se actualiza al navegar, enfocar la ventana o recargar Mi mantención, incluida la recarga posterior a resolver. La resolución invalida una consulta anterior para que su respuesta tardía no reemplace el estado del badge. No hay push ni actualización periódica; una aprobación administrativa en otra ventana se refleja en la siguiente consulta.

## Hallazgos y límites de la verificación

1. **RN-04 incompleta:** la corrección manual de prioridad sigue sin endpoint/DTO aprobado en `API_CONTRACTS.md` y no aparece en el controlador de tickets. Registrado como `PD-017`; no se inventó un contrato.
2. **Pruebas backend bloqueadas:** `tickets.service.spec.ts:63` construye `TicketsService` con tres argumentos, pero la clase exige un cuarto, `EvidenceService`. La suite no llega a ejecutar sus escenarios de ciclo de vida.
3. **Compilación de pruebas frontend bloqueada por código previo:** `my-requests-page.component.spec.ts` usa `nextPage`, `previousPage`, `pageLinks` y `goToPage`, inexistentes en el componente actual. El compilador incluye estos archivos incluso al seleccionar otros tests mediante `--include`.
4. **Siete fallos en pruebas existentes al ampliar la revisión:** tres tests de evidencia simulan `FileList` con un array sin `item()`; cuatro tests de Gestión buscan controles/textos antiguos. La suite de Gestión también emite errores por ausencia de `ResizeObserver` y avisos de registro de iconos en su entorno de pruebas. No se modificaron esos archivos.
5. **Sin E2E funcional disponible:** web-e2e todavía comprueba un encabezado “Welcome” y api-e2e la respuesta inicial “Hello API”. No validan el flujo actual. No se ejecutó una demo con API/PostgreSQL ni una prueba de concurrencia real; tampoco se hizo verificación visual en navegador.
6. **Límite de Gestión:** carga como máximo 100 tickets y 100 técnicos. Su paginación local y conteos no representan necesariamente el total; el dashboard sí utiliza agregaciones del servidor. Ampliar la paginación queda fuera de esta fase.
7. **Resolución requiere evidencia:** el contrato y servicio actuales exigen imagen final asociada a la asignación actual, además del trabajo realizado. Preparar una imagen de prueba para la demo y verificar la configuración del almacenamiento. No se cambió este requisito.

## Validación ejecutada

- Revisión del diff completo, contratos y componentes nuevos; `git diff --check` sin errores.
- `npx nx run web:build`: compilación de producción correcta. Advertencias: imports de router sin uso en `App`, bundle inicial sobre el umbral de advertencia de 500 kB y CSS de login sobre 4 kB. No se alteraron presupuestos para ocultarlas.
- Pruebas específicas de la fase: **49/49 correctas en 6 archivos**: aplicación/rutas, guard de rol, estado compartido, gateway HTTP, dashboard y sidebar. Cubren acceso por rol, endpoint administrativo, todos los KPI, errores/reintento/cero, disponibilidad, colapso y respuesta tardía tras resolver.
- Se utilizó temporalmente `apps/web/tsconfig.panels-validation.json`, extendiendo `tsconfig.spec.json` con los archivos seleccionados, para aislar el error de compilación previo de Mis solicitudes. El archivo temporal fue retirado al terminar; las pruebas nuevas permanecen en el repositorio.
- Revisión frontend ampliada previa: **78 correctas y 7 fallidas, 85 en total**, incluyendo Mi mantención y Gestión; fallos detallados arriba.
- `npx nx test api --runInBand --testPathPatterns="tickets.service.spec|ticket-priority-calculator.spec|technicians.service.spec|dashboard.service.spec"`: **10 tests correctos en 3 suites** (prioridad, disponibilidad y dashboard); suite de tickets bloqueada por compilación.
- Estas son pruebas unitarias/de componentes con dobles HTTP/repositorios; no demuestran por sí solas integridad real de PostgreSQL ni integración completa.

## Reglas y criterios relacionados

- Navegación por rol y solicitudes propias: `RN-02`, `RN-08`, `RN-18`; `CA-01`. Las redirecciones no reemplazan la autorización del backend.
- Disponibilidad visible: `RN-06`, `RN-09`, `RN-11`, `RN-19`; `CA-07`, `CA-08`, `CA-13`, limitada aquí a reflejar respuestas de la API.
- Acciones de asignación/reasignación, congelamiento y cierre enlazadas desde el dashboard: `RN-05`, `RN-14`, `RN-21`; no se modificaron sus reglas.
- La verificación completa de `CA-02` a `CA-14` sigue pendiente de recuperar las suites de flujo y ejecutar integración/E2E.

## Archivos y proyectos

Cambios limitados a `apps/web` y `docs`:

- `app.routes.ts`, `app.spec.ts`: inicio por rol, dashboard lazy y pruebas de navegación.
- `core/home.guard.ts`, `core/role.guard.spec.ts`: redirecciones y cobertura.
- `core/current-maintenance-status.service.ts` y su spec: estado remoto compartido y protección del badge ante respuestas anteriores a resolución.
- `core/tickets/http-ticket.gateway.ts` y su spec: listado administrativo y conexión con estado técnico.
- `features/dashboard/admin-dashboard.service.ts`, `admin-dashboard-page.component.ts`, `.html` y `.spec.ts`: contrato, panel y pruebas.
- `layout/app-shell.component.ts`, `.html` y `.spec.ts`: badge y actualización por navegación/foco.
- `shared/navigation/navigation.model.ts`: menú específico por rol.
- Se retiró `features/home/home-page.ts`, la maqueta con cifras fijas; es recuperable desde Git.
- `docs/SCREENS_AND_NAVIGATION.md`, `docs/PENDING_DECISIONS.md` y este informe: decisiones, límites y evidencia de validación.

## Base de datos, supuestos y siguiente trabajo

No hay migraciones, cambios de esquema, seed, dependencias nuevas, commits ni push. Se reutilizó Mi mantención existente; no se creó un segundo flujo técnico. Se mantuvieron las rutas históricas en español por compatibilidad.

Antes de considerar el flujo completo listo: actualizar las pruebas previas, aprobar el contrato de corrección de prioridad y ejecutar la demo normal y congelamiento/reasignación contra API/PostgreSQL, incluida evidencia final y concurrencia de asignación. Este trabajo no se implementó en la fase actual.

Commit sugerido: `feat(web): tailor role landing pages and consume admin KPIs`.
