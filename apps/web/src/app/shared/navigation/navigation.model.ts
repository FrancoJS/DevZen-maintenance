export type UserRole = 'REQUESTER' | 'TECHNICIAN' | 'ADMIN';

export interface NavigationItem {
  label: string;
  route: string;
  icon: string;
  roles: UserRole[];
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

export const NAVIGATION_GROUPS: NavigationGroup[] = [
  { label: 'Menú principal', items: [
    { label: 'Inicio', route: '/inicio', icon: '⌂', roles: ['REQUESTER', 'TECHNICIAN'] },
    { label: 'Mis solicitudes', route: '/mis-solicitudes', icon: '▤', roles: ['REQUESTER', 'TECHNICIAN', 'ADMIN'] },
    { label: 'Mi mantención', route: '/mi-mantencion', icon: '⚒', roles: ['TECHNICIAN'] },
    { label: 'Historial', route: '/historial-mantenciones', icon: '◷', roles: ['TECHNICIAN'] },
  ] },
  { label: 'Administración', items: [
    { label: 'Dashboard', route: '/inicio', icon: '⌂', roles: ['ADMIN'] },
    { label: 'Gestión de tickets', route: '/gestion-tickets', icon: '▤', roles: ['ADMIN'] },
    { label: 'Congelamientos', route: '/congelamientos', icon: '❄', roles: ['ADMIN'] },
    { label: 'Historial global', route: '/historial-global', icon: '◷', roles: ['ADMIN'] },
  ] },
];
