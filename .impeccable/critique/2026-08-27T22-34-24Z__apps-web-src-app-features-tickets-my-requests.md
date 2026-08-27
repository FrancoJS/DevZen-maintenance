---
target: Mis solicitudes
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-27T22-34-24Z
slug: apps-web-src-app-features-tickets-my-requests
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3/4 | Las transiciones de página y envío podrían comunicar mejor el progreso. |
| 2 | Match System / Real World | 3/4 | La búsqueda local contradice parcialmente la expectativa de una búsqueda global. |
| 3 | User Control and Freedom | 2/4 | Los diálogos no gestionan foco ni consumen `?create=1` al cerrar. |
| 4 | Consistency and Standards | 3/4 | La jerarquía de la CTA de creación cambia entre cabecera y estado vacío. |
| 5 | Error Prevention | 3/4 | Cerrar por backdrop puede descartar una creación en curso. |
| 6 | Recognition Rather Than Recall | 3/4 | El alcance local de la búsqueda no está en su propia etiqueta. |
| 7 | Flexibility and Efficiency | 1/4 | Solo hay paginación; no hay atajos ni filtros orientados a tareas. |
| 8 | Aesthetic and Minimalist Design | 3/4 | El formulario reúne demasiadas decisiones en un único modal largo. |
| 9 | Error Recovery | 3/4 | Los errores de red y de conflicto de estado se comunican igual. |
| 10 | Help and Documentation | 1/4 | Faltan ayudas sobre prioridad, estados y respuestas de impacto. |
| **Total** | | **25/40** | **Aceptable: buena base, pero con fricción de accesibilidad e interacción.** |

## Design Specificity Verdict

El flujo es una pantalla de operación competente y coherente con Spartan/Tailwind: panel oscuro, navegación por rol, estados de ticket, tarjetas responsivas y una tabla bien estructurada. Sin embargo, sigue siendo intercambiable con un helpdesk o CRM genérico. El carácter de mantenimiento correctivo aparece sobre todo en las etiquetas; aún no determina la jerarquía ni la interacción.

El detector determinista no encontró hallazgos en `apps/web/src/app/features/tickets/my-requests` (0 reglas, 0 falsos positivos). No contradice la revisión: los problemas relevantes son de comportamiento, foco, carga cognitiva y claridad contextual, no de patrones estáticos detectables.

No hubo overlay visual confiable: la ruta local redirigió a login y el navegador disponible solo permitió evaluación de lectura, por lo que no pudo inyectarse `detect.js`.

## Overall Impression

La base está lista para una demostración fiable: muestra carga, vacío, error, reintento, filtrado, paginación y detalle. La oportunidad decisiva es hacer que reportar una falla se sienta como una entrega breve y segura de un incidente, no como completar una encuesta larga dentro de un modal personalizado.

## What's Working

1. Los estados de carga, vacío, filtrado vacío, error/reintento y fallo de detalle son deliberados y reducen la incertidumbre.
2. La tabla de escritorio y las tarjetas móviles preservan los datos esenciales y las acciones siguen siendo legibles en ambos formatos.
3. La semántica inicial es sólida: etiquetas reales, `caption` de tabla, `aria-live`, alertas y texto junto al color de estados/prioridades.

## Priority Issues

### [P1] Los modales no cierran el circuito de accesibilidad ni de control

**Why it matters:** `role="dialog"` y `aria-modal` no mueven, atrapan ni devuelven el foco. El teclado puede continuar detrás del overlay. Además, un clic en el fondo puede descartar una solicitud creada parcialmente y `?create=1` vuelve a abrir el modal al recargar tras cerrarlo.

**Fix:** usar el diálogo Spartan accesible o implementar foco inicial, focus trap, retorno del foco y cierre por Escape. Pedir confirmación al cerrar una creación con cambios y consumir/eliminar el parámetro `create` tras abrir o cerrar.

**Suggested command:** `$impeccable harden`

### [P1] El formulario de reporte tiene demasiadas decisiones en una sola superficie desplazable

**Why it matters:** una persona que reporta una falla urgente debe procesar campos y cinco preguntas de impacto sin una señal de avance, horizonte de finalización ni ayuda contextual. Aumenta abandono y respuestas imprecisas.

**Fix:** conservar todos los campos, pero separar datos básicos e impacto en dos secciones o pasos con progreso visible (`1 de 2`), agrupación clara y una explicación breve de cómo se calcula la prioridad.

**Suggested command:** `$impeccable shape` y luego `$impeccable distill`

### [P2] La búsqueda y los filtros tienen un modelo mental mixto

**Why it matters:** estado y prioridad consultan al servidor, mientras que el texto solo busca en la página ya cargada. La aclaración existe, pero la etiqueta “Buscar por ticket o equipo” todavía promete una búsqueda más amplia.

**Fix:** renombrar a “Buscar en esta página”, mostrar el rango actual (`21–40 de 86`) o implementar búsqueda de servidor solo cuando sea aprobada.

**Suggested command:** `$impeccable clarify`

### [P2] La CTA del estado vacío pierde jerarquía

**Why it matters:** “Crear mi primera solicitud” usa variante outline mientras que la CTA de cabecera es primaria. El estado vacío es precisamente el momento de máxima necesidad de orientación.

**Fix:** usar el tratamiento primario para la creación inicial y reservar outline para acciones secundarias.

**Suggested command:** `$impeccable layout`

### [P2] La recuperación de conflictos de edición no explica qué ocurrió

**Why it matters:** un cambio de estado autorizado por backend y un problema de red generan un mensaje parecido. Tras recargar, la persona no recibe una explicación del resultado real.

**Fix:** distinguir errores transportables de conflictos y comunicar el estado autoritativo: por ejemplo, “La solicitud cambió a Asignada y ya no puede editarse”.

**Suggested command:** `$impeccable clarify`

## Persona Red Flags

### Jordan (primera vez)

Entiende la CTA y los estados vacíos, pero las cinco preguntas de impacto no explican por qué afectan la prioridad ni aclaran estados operativos. Puede responder por intuición y dudar de que el ticket haya quedado correctamente clasificado.

### Sam (persona dependiente de accesibilidad)

Las etiquetas, captions y alertas ayudan, pero los overlays personalizados no establecen un contrato de foco: al abrir, no se enfoca el título ni el primer control; al cerrar, no se devuelve el foco al activador; y el contenido del fondo puede seguir siendo alcanzable.

### Casey (uso móvil interrumpido)

Las tarjetas móviles funcionan bien, pero el formulario de hasta `90vh` obliga a mucho desplazamiento. Si cambia de aplicación, recarga o toca accidentalmente el backdrop, no hay borrador ni protección frente a pérdida de datos.

## Minor Observations

- El detalle usa “Estado” como texto plano mientras el listado lo muestra como badge; normalizar el patrón acelera el escaneo.
- Separar rango y total haría más liviano el texto “X resultados en esta página de Y solicitudes”.
- Falta explicación visible de cómo las respuestas de impacto determinan la prioridad automática.
- Mantener el texto junto al color de estado/prioridad es correcto y debe conservarse en el detalle e historial.

## Questions to Consider

1. ¿Cómo se vería el reporte si fuese una entrega breve de incidente en lugar de una encuesta?
2. ¿Una persona realmente piensa en ocho estados de ciclo de vida al filtrar, o en grupos como “en curso” y “finalizadas”?
3. Si un técnico abre este flujo durante una falla, ¿qué señal le confirma sin ambigüedad que su reporte se guardó?
