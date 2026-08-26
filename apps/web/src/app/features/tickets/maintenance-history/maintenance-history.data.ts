import { MaintenanceHistoryRecord } from './maintenance-history.models';

const camila = { id: 'user-camila-rojas', name: 'Camila Rojas', role: 'REQUESTER' as const };
const diego = { id: 'tech-diego-perez', name: 'Diego Pérez', role: 'TECHNICIAN' as const };
const valentina = { id: 'tech-valentina-silva', name: 'Valentina Silva', role: 'TECHNICIAN' as const };
const ana = { id: 'admin-ana-gonzalez', name: 'Ana González', role: 'ADMIN' as const };

export const PREVIEW_TECHNICIAN_ID = diego.id;

export const MAINTENANCE_HISTORY_RECORDS: MaintenanceHistoryRecord[] = [
  {
    ticketId: 'TCK-2048',
    asset: 'Compresor C-12',
    location: 'Planta 2 · Sala de compresores',
    requesterName: camila.name,
    priority: 'HIGH',
    status: 'CLOSED',
    participants: [
      {
        id: diego.id,
        name: diego.name,
        assignedAt: '2026-08-24T09:30:00-04:00',
        releasedAt: '2026-08-24T13:45:00-04:00',
        releaseReason: 'Mantención resuelta',
      },
    ],
    resolvedAt: '2026-08-24T13:45:00-04:00',
    closedAt: '2026-08-25T08:15:00-04:00',
    events: [
      { id: 'event-2048-1', action: 'CREATED', actor: camila, occurredAt: '2026-08-24T08:50:00-04:00', newStatus: 'NEW', details: 'Falla reportada en el sistema de presión.' },
      { id: 'event-2048-2', action: 'PRIORITY_CALCULATED', actor: camila, occurredAt: '2026-08-24T08:50:01-04:00', details: 'Prioridad alta calculada según la evaluación de impacto.' },
      { id: 'event-2048-3', action: 'ASSIGNED', actor: ana, occurredAt: '2026-08-24T09:30:00-04:00', previousStatus: 'NEW', newStatus: 'ASSIGNED', details: 'Diego Pérez fue asignado a la mantención.' },
      { id: 'event-2048-4', action: 'STARTED', actor: diego, occurredAt: '2026-08-24T09:45:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-2048-5', action: 'RESOLVED', actor: diego, occurredAt: '2026-08-24T13:45:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', details: 'Se reemplazó el regulador de presión y se verificó la operación.' },
      { id: 'event-2048-6', action: 'CLOSED', actor: ana, occurredAt: '2026-08-25T08:15:00-04:00', previousStatus: 'RESOLVED', newStatus: 'CLOSED', details: 'Cierre administrativo confirmado.' },
    ],
  },
  {
    ticketId: 'TCK-2037',
    asset: 'Horno industrial H-04',
    location: 'Planta 1 · Línea de tratamiento térmico',
    requesterName: camila.name,
    priority: 'CRITICAL',
    status: 'RESOLVED',
    participants: [
      {
        id: diego.id,
        name: diego.name,
        assignedAt: '2026-08-25T07:50:00-04:00',
        releasedAt: '2026-08-25T12:20:00-04:00',
        releaseReason: 'Mantención resuelta',
      },
    ],
    resolvedAt: '2026-08-25T12:20:00-04:00',
    events: [
      { id: 'event-2037-1', action: 'CREATED', actor: camila, occurredAt: '2026-08-25T07:15:00-04:00', newStatus: 'NEW', details: 'Temperatura fuera de rango durante la operación.' },
      { id: 'event-2037-2', action: 'PRIORITY_CALCULATED', actor: camila, occurredAt: '2026-08-25T07:15:01-04:00', details: 'Prioridad crítica por riesgo de seguridad.' },
      { id: 'event-2037-3', action: 'ASSIGNED', actor: ana, occurredAt: '2026-08-25T07:50:00-04:00', previousStatus: 'NEW', newStatus: 'ASSIGNED', details: 'Diego Pérez fue asignado a la mantención.' },
      { id: 'event-2037-4', action: 'STARTED', actor: diego, occurredAt: '2026-08-25T08:05:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-2037-5', action: 'RESOLVED', actor: diego, occurredAt: '2026-08-25T12:20:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', details: 'Se corrigió la calibración del termopar y se realizaron pruebas de temperatura.' },
    ],
  },
  {
    ticketId: 'TCK-2019',
    asset: 'Transportador T-04',
    location: 'Planta 2 · Área de envasado',
    requesterName: 'Martín Fuentes',
    priority: 'MEDIUM',
    status: 'CLOSED',
    participants: [
      {
        id: diego.id,
        name: diego.name,
        assignedAt: '2026-08-18T10:00:00-04:00',
        releasedAt: '2026-08-18T11:10:00-04:00',
        releaseReason: 'Congelamiento aprobado',
      },
      {
        id: valentina.id,
        name: valentina.name,
        assignedAt: '2026-08-19T09:20:00-04:00',
        releasedAt: '2026-08-19T12:35:00-04:00',
        releaseReason: 'Mantención resuelta',
      },
    ],
    resolvedAt: '2026-08-19T12:35:00-04:00',
    closedAt: '2026-08-20T09:05:00-04:00',
    events: [
      { id: 'event-2019-1', action: 'CREATED', actor: { id: 'user-martin-fuentes', name: 'Martín Fuentes', role: 'REQUESTER' }, occurredAt: '2026-08-18T09:20:00-04:00', newStatus: 'NEW', details: 'La banda transportadora presenta desalineación intermitente.' },
      { id: 'event-2019-2', action: 'PRIORITY_CALCULATED', actor: { id: 'user-martin-fuentes', name: 'Martín Fuentes', role: 'REQUESTER' }, occurredAt: '2026-08-18T09:20:01-04:00', details: 'Prioridad media calculada según la evaluación de impacto.' },
      { id: 'event-2019-3', action: 'ASSIGNED', actor: ana, occurredAt: '2026-08-18T10:00:00-04:00', previousStatus: 'NEW', newStatus: 'ASSIGNED', details: 'Diego Pérez fue asignado a la mantención.' },
      { id: 'event-2019-4', action: 'STARTED', actor: diego, occurredAt: '2026-08-18T10:15:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-2019-5', action: 'FREEZE_REQUESTED', actor: diego, occurredAt: '2026-08-18T10:50:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'FREEZE_REQUESTED', details: 'Se requiere detener la línea para acceder al rodillo principal.' },
      { id: 'event-2019-6', action: 'FREEZE_APPROVED', actor: ana, occurredAt: '2026-08-18T11:10:00-04:00', previousStatus: 'FREEZE_REQUESTED', newStatus: 'FROZEN', details: 'Congelamiento aprobado; Diego Pérez queda liberado.' },
      { id: 'event-2019-7', action: 'BLOCKER_RESOLVED', actor: ana, occurredAt: '2026-08-19T08:55:00-04:00', previousStatus: 'FROZEN', newStatus: 'PENDING_REASSIGNMENT', details: 'Línea detenida y bloqueo operativo resuelto.' },
      { id: 'event-2019-8', action: 'REASSIGNED', actor: ana, occurredAt: '2026-08-19T09:20:00-04:00', previousStatus: 'PENDING_REASSIGNMENT', newStatus: 'ASSIGNED', details: 'Valentina Silva fue reasignada a la mantención.' },
      { id: 'event-2019-9', action: 'STARTED', actor: valentina, occurredAt: '2026-08-19T09:35:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-2019-10', action: 'RESOLVED', actor: valentina, occurredAt: '2026-08-19T12:35:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', details: 'Se alineó la banda y se reemplazó el rodamiento desgastado.' },
      { id: 'event-2019-11', action: 'CLOSED', actor: ana, occurredAt: '2026-08-20T09:05:00-04:00', previousStatus: 'RESOLVED', newStatus: 'CLOSED', details: 'Cierre administrativo confirmado.' },
    ],
  },
  {
    ticketId: 'TCK-2004',
    asset: 'Bomba hidráulica B-07',
    location: 'Planta 3 · Taller de prensas',
    requesterName: 'Sofía Morales',
    priority: 'LOW',
    status: 'CLOSED',
    participants: [
      {
        id: valentina.id,
        name: valentina.name,
        assignedAt: '2026-08-16T08:30:00-04:00',
        releasedAt: '2026-08-16T10:10:00-04:00',
        releaseReason: 'Mantención resuelta',
      },
    ],
    resolvedAt: '2026-08-16T10:10:00-04:00',
    closedAt: '2026-08-16T15:40:00-04:00',
    events: [
      { id: 'event-2004-1', action: 'CREATED', actor: { id: 'user-sofia-morales', name: 'Sofía Morales', role: 'REQUESTER' }, occurredAt: '2026-08-16T07:55:00-04:00', newStatus: 'NEW', details: 'Se detectó una filtración menor en una conexión.' },
      { id: 'event-2004-2', action: 'PRIORITY_CALCULATED', actor: { id: 'user-sofia-morales', name: 'Sofía Morales', role: 'REQUESTER' }, occurredAt: '2026-08-16T07:55:01-04:00', details: 'Prioridad baja calculada según la evaluación de impacto.' },
      { id: 'event-2004-3', action: 'ASSIGNED', actor: ana, occurredAt: '2026-08-16T08:30:00-04:00', previousStatus: 'NEW', newStatus: 'ASSIGNED', details: 'Valentina Silva fue asignada a la mantención.' },
      { id: 'event-2004-4', action: 'STARTED', actor: valentina, occurredAt: '2026-08-16T08:45:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-2004-5', action: 'RESOLVED', actor: valentina, occurredAt: '2026-08-16T10:10:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', details: 'Se ajustó la conexión hidráulica y no se observaron nuevas filtraciones.' },
      { id: 'event-2004-6', action: 'CLOSED', actor: ana, occurredAt: '2026-08-16T15:40:00-04:00', previousStatus: 'RESOLVED', newStatus: 'CLOSED', details: 'Cierre administrativo confirmado.' },
    ],
  },
  {
    ticketId: 'TCK-1998',
    asset: 'Prensa P-03',
    location: 'Planta 3 · Área de estampado',
    requesterName: 'Sofía Morales',
    priority: 'HIGH',
    status: 'RESOLVED',
    participants: [
      {
        id: valentina.id,
        name: valentina.name,
        assignedAt: '2026-08-14T13:20:00-04:00',
        releasedAt: '2026-08-14T17:30:00-04:00',
        releaseReason: 'Mantención resuelta',
      },
    ],
    resolvedAt: '2026-08-14T17:30:00-04:00',
    events: [
      { id: 'event-1998-1', action: 'CREATED', actor: { id: 'user-sofia-morales', name: 'Sofía Morales', role: 'REQUESTER' }, occurredAt: '2026-08-14T12:40:00-04:00', newStatus: 'NEW', details: 'La prensa no completa el ciclo de estampado.' },
      { id: 'event-1998-2', action: 'PRIORITY_CALCULATED', actor: { id: 'user-sofia-morales', name: 'Sofía Morales', role: 'REQUESTER' }, occurredAt: '2026-08-14T12:40:01-04:00', details: 'Prioridad alta calculada según la evaluación de impacto.' },
      { id: 'event-1998-3', action: 'ASSIGNED', actor: ana, occurredAt: '2026-08-14T13:20:00-04:00', previousStatus: 'NEW', newStatus: 'ASSIGNED', details: 'Valentina Silva fue asignada a la mantención.' },
      { id: 'event-1998-4', action: 'STARTED', actor: valentina, occurredAt: '2026-08-14T13:35:00-04:00', previousStatus: 'ASSIGNED', newStatus: 'IN_PROGRESS' },
      { id: 'event-1998-5', action: 'RESOLVED', actor: valentina, occurredAt: '2026-08-14T17:30:00-04:00', previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED', details: 'Se sustituyó el sensor de posición y se realizaron ciclos de prueba.' },
    ],
  },
];
