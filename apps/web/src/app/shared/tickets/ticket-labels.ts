import { TicketPriority, TicketStatus, UserRole } from '../../core/tickets/ticket.models';

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Nueva',
  ASSIGNED: 'Asignada',
  IN_PROGRESS: 'En proceso',
  FREEZE_REQUESTED: 'Congelamiento solicitado',
  FROZEN: 'Congelada',
  PENDING_REASSIGNMENT: 'Pendiente de reasignación',
  RESOLVED: 'Resuelta',
  CLOSED: 'Cerrada',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  REQUESTER: 'Solicitante',
  TECHNICIAN: 'Técnico',
  ADMIN: 'Administrador',
};
