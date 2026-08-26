# Reglas de prioridad automática

## Principio

El usuario no selecciona la prioridad. Responde cinco preguntas objetivas y el backend calcula el resultado de forma determinística. Las respuestas se almacenan para que la clasificación sea explicable (`RN-03`, `CA-03`).

## Preguntas y valores funcionales

| # | Pregunta | Identificador técnico | Respuestas |
|---|---|---|---|
| 1 | ¿Existe riesgo para la seguridad de una persona? | `safetyRisk` | Sí / No |
| 2 | ¿La falla detiene completamente el equipo? | `equipmentStopped` | Sí / Parcialmente / No |
| 3 | ¿La falla afecta el proceso productivo? | `productionImpact` | Detiene producción / Reduce producción / No afecta |
| 4 | ¿Existe una alternativa temporal para continuar trabajando? | `workaroundAvailable` | Sí / No |
| 5 | ¿La falla afecta a otros equipos o áreas? | `affectsOtherAreas` | Sí / No |

Los valores persistentes exactos de las respuestas categóricas son una decisión técnica pendiente; no se inventan aquí.

## Orden obligatorio

`CRITICAL -> HIGH -> MEDIUM -> LOW`

La primera regla cumplida determina el resultado.

## Condiciones exactas

### `CRITICAL` — Crítica

Si se cumple al menos una:

- `safetyRisk = true`;
- `productionImpact = Detiene producción` y `workaroundAvailable = false`.

### `HIGH` — Alta

Solo si no fue `CRITICAL`, cuando se cumple al menos una:

- el equipo está completamente detenido;
- la producción está detenida;
- la producción está reducida y no existe alternativa temporal;
- otros equipos o áreas están afectados.

### `MEDIUM` — Media

Solo si no fue `CRITICAL` ni `HIGH`, cuando se cumple al menos una:

- el equipo está parcialmente detenido;
- la producción está reducida.

### `LOW` — Baja

Solo si no se cumple ninguna regla anterior.

`workaroundAvailable` por sí sola no aumenta la prioridad; modifica el efecto de una detención o reducción productiva.

## Responsabilidades

- Backend: validar respuestas, calcular en el orden indicado, persistir evaluación y prioridad, y devolver el resultado.
- Frontend: recopilar las cinco respuestas y mostrar la prioridad devuelta. Puede ofrecer una vista previa solo como UX, nunca como fuente persistente.
- Historial: registrar el resultado automático y cualquier corrección administrativa relevante.

## Override administrativo

Solo `ADMIN` puede corregir la prioridad (`RN-04`). El cambio:

- exige motivo no vacío;
- registra prioridad anterior y nueva;
- registra administrador y timestamp;
- aparece en el historial;
- no sustituye el cálculo automático original ni borra las respuestas.

## Ejemplos derivados

| Caso | Respuestas relevantes | Resultado y razón |
|---|---|---|
| Riesgo personal | `safetyRisk = true`; restantes valores cualesquiera | `CRITICAL`, porque seguridad se evalúa primero. |
| Producción detenida sin alternativa | Sin riesgo; producción detenida; `workaroundAvailable = false` | `CRITICAL`. |
| Producción detenida con alternativa | Sin riesgo; producción detenida; `workaroundAvailable = true` | `HIGH`. |
| Equipo completamente detenido sin impacto productivo | Sin riesgo; equipo detenido; producción no afectada | `HIGH`. |
| Producción reducida sin alternativa | Sin riesgo; producción reducida; `workaroundAvailable = false` | `HIGH`. |
| Producción reducida con alternativa | Sin riesgo; equipo no detenido; producción reducida; alternativa disponible; sin otras áreas afectadas | `MEDIUM`. |
| Equipo parcialmente detenido | Sin riesgo; detención parcial; producción no afectada; sin otras áreas afectadas | `MEDIUM`. |
| Sin impactos | Sin riesgo; equipo no detenido; producción no afectada; sin otras áreas afectadas | `LOW`. |

## Pruebas mínimas sugeridas

- Una prueba unitaria por condición de cada nivel.
- Casos de precedencia donde coincidan reglas de dos niveles.
- Caso que demuestre que `workaroundAvailable = false` aislado no eleva prioridad.
- Integración de creación que persista respuestas y prioridad calculada.
- Autorización y auditoría del override administrativo.

