# Flujo recomendado de demostración

## Objetivo del pitch

Demostrar en aproximadamente cinco minutos que el sistema organiza una falla real de maquinaria, aplica reglas determinísticas, controla capacidad y conserva trazabilidad. La explicación debe privilegiar el valor operativo sobre detalles técnicos.

## Flujo normal

| Paso | Acción | Qué demuestra al jurado |
|---|---|---|
| 1 | Solicitante crea un ticket y responde las cinco preguntas. | Reporte estandarizado con usuario, máquina, descripción y contexto. |
| 2 | El backend calcula la prioridad. | Clasificación objetiva, automática y explicable. |
| 3 | Administrador visualiza técnicos. | Disponibilidad derivada; un técnico ocupado y otro disponible. |
| 4 | Administrador asigna al disponible. | Control de rol, capacidad y transición `NEW -> ASSIGNED`. |
| 5 | Técnico inicia. | Ownership del trabajo y transición `ASSIGNED -> IN_PROGRESS`. |
| 6 | Técnico registra diagnóstico y trabajo. | Información técnica integrada al mismo ticket. |
| 7 | Técnico resuelve. | `IN_PROGRESS -> RESOLVED`, liberación inmediata del técnico e historial conservado. |
| 8 | Administrador cierra. | Separación entre resolución técnica y cierre administrativo. |
| 9 | Administrador revisa historial. | Identidad única y trazabilidad completa con actores/timestamps. |

Secuencia: `NEW -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED`.

## Flujo destacado de congelamiento

Secuencia autorizada:

`IN_PROGRESS -> FREEZE_REQUESTED -> FROZEN -> PENDING_REASSIGNMENT -> ASSIGNED -> IN_PROGRESS`

| Paso | Acción | Qué demuestra |
|---|---|---|
| 1 | Técnico actual solicita congelamiento con motivo. | Solo el responsable puede pausar; la causa queda registrada. |
| 2 | Mientras está `FREEZE_REQUESTED`, se muestra al técnico ocupado. | La solicitud pendiente no libera capacidad (`CA-13`). |
| 3 | Administrador aprueba. | Control administrativo; ticket `FROZEN`, asignación liberada y técnico disponible (`CA-08`). |
| 4 | Administrador marca bloqueo resuelto. | No hay reactivación automática; pasa a `PENDING_REASSIGNMENT` (`CA-14`). |
| 5 | Administrador asigna al original u otro disponible. | Reasignación flexible, validada y trazable (`CA-10`). |
| 6 | Técnico asignado inicia otra vez. | Se respeta el paso `ASSIGNED` antes de volver a `IN_PROGRESS` (`CA-09`). |

## Distribución orientativa del tiempo

- 30–45 s: equipo, industria y problema.
- 2–3 min: flujo normal completo.
- 60–90 s: congelamiento o una versión preparada del flujo.
- 30–45 s: historial, tecnologías y cierre.

Esta distribución es orientativa para preparar el pitch, no una regla funcional.

## Datos de apoyo

La demo debería contar con datos ficticios: un usuario por rol, al menos dos técnicos (uno disponible y otro ocupado), tickets en varios estados/prioridades, un flujo completo y un caso de congelamiento/reasignación. No se requieren ediciones ocultas de base de datos durante la presentación.

