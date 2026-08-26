import { computed, Injectable, signal } from '@angular/core';
import { UserRole } from '../shared/navigation/navigation.model';

export interface PreviewUser { name: string; initials: string; roleLabel: string; }
export interface DemoUser extends PreviewUser { email: string; password: string; role: UserRole; }

const ROLE_STORAGE_KEY = 'devzen-preview-role';
const SESSION_STORAGE_KEY = 'devzen-mock-session';
export const DEMO_USERS: Record<UserRole, DemoUser> = {
  REQUESTER: {
    name: 'Camila Rojas',
    initials: 'CR',
    roleLabel: 'Solicitante',
    email: 'camila.rojas@devzen.test',
    password: 'Solicitante123!',
    role: 'REQUESTER',
  },
  TECHNICIAN: {
    name: 'Diego Pérez',
    initials: 'DP',
    roleLabel: 'Técnico',
    email: 'diego.perez@devzen.test',
    password: 'Tecnico123!',
    role: 'TECHNICIAN',
  },
  ADMIN: {
    name: 'Ana González',
    initials: 'AG',
    roleLabel: 'Administrador',
    email: 'ana.gonzalez@devzen.test',
    password: 'Admin123!',
    role: 'ADMIN',
  },
};

interface StoredSession { email: string; role: UserRole; }

@Injectable({ providedIn: 'root' })
export class PreviewSessionService {
  readonly isAuthenticated = signal(this.readStoredSession() !== null);
  readonly role = signal<UserRole>(this.readStoredRole());
  readonly user = computed(() => DEMO_USERS[this.role()]);

  login(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const user = Object.values(DEMO_USERS).find(
      (candidate) => candidate.email === normalizedEmail && candidate.password === password
    );

    if (!user) return false;

    this.setRole(user.role);
    this.writeStoredSession({ email: user.email, role: user.role });
    this.isAuthenticated.set(true);
    return true;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.role.set('ADMIN');

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(ROLE_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  setRole(role: UserRole): void {
    this.role.set(role);
    if (typeof localStorage === 'undefined') return;

    localStorage.setItem(ROLE_STORAGE_KEY, role);
    if (this.readStoredSession()) {
      this.writeStoredSession({ email: DEMO_USERS[role].email, role });
    }
  }

  private readStoredRole(): UserRole {
    if (typeof localStorage === 'undefined') return 'ADMIN';

    const storedSession = this.readStoredSession();
    if (storedSession) return storedSession.role;

    const stored = localStorage.getItem(ROLE_STORAGE_KEY);
    return stored === 'REQUESTER' || stored === 'TECHNICIAN' || stored === 'ADMIN' ? stored : 'ADMIN';
  }

  private readStoredSession(): StoredSession | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    try {
      const session = JSON.parse(stored) as Partial<StoredSession>;
      const user = Object.values(DEMO_USERS).find((candidate) => candidate.email === session.email);
      return user && session.role === user.role ? { email: user.email, role: user.role } : null;
    } catch {
      return null;
    }
  }

  private writeStoredSession(session: StoredSession): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }
}
