import { computed, Injectable, signal } from '@angular/core';
import { UserRole } from '../shared/navigation/navigation.model';

export interface PreviewUser { name: string; initials: string; roleLabel: string; }
const ROLE_STORAGE_KEY = 'devzen-preview-role';
const USERS: Record<UserRole, PreviewUser> = {
  REQUESTER: { name: 'Camila Rojas', initials: 'CR', roleLabel: 'Solicitante' },
  TECHNICIAN: { name: 'Diego Pérez', initials: 'DP', roleLabel: 'Técnico' },
  ADMIN: { name: 'Ana González', initials: 'AG', roleLabel: 'Administrador' },
};

@Injectable({ providedIn: 'root' })
export class PreviewSessionService {
  readonly role = signal<UserRole>(this.readStoredRole());
  readonly user = computed(() => USERS[this.role()]);

  setRole(role: UserRole): void {
    this.role.set(role);
    if (typeof localStorage !== 'undefined') localStorage.setItem(ROLE_STORAGE_KEY, role);
  }

  private readStoredRole(): UserRole {
    if (typeof localStorage === 'undefined') return 'ADMIN';
    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return stored === 'REQUESTER' || stored === 'TECHNICIAN' || stored === 'ADMIN' ? stored : 'ADMIN';
  }
}
