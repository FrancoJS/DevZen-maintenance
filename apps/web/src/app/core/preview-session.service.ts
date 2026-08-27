import { computed, Injectable, signal } from '@angular/core';
import { UserRole } from '../shared/navigation/navigation.model';
import { ACCESS_TOKEN_STORAGE_KEY } from './api.config';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface PreviewUser extends AuthenticatedUser {
  initials: string;
  roleLabel: string;
}

export interface DemoUser extends PreviewUser {
  password: string;
}

const SESSION_STORAGE_KEY = 'devzen-mock-session';
const LEGACY_ROLE_STORAGE_KEY = 'devzen-preview-role';

const ROLE_LABELS: Record<UserRole, string> = {
  REQUESTER: 'Solicitante',
  TECHNICIAN: 'Técnico',
  ADMIN: 'Administrador',
};

export const DEMO_USERS: Record<UserRole, DemoUser> = {
  REQUESTER: {
    id: 'demo-camila-rojas',
    name: 'Camila Rojas',
    initials: 'CR',
    roleLabel: 'Solicitante',
    email: 'camila.rojas@devzen.test',
    password: 'Solicitante123!',
    role: 'REQUESTER',
  },
  TECHNICIAN: {
    id: 'demo-diego-perez',
    name: 'Diego Pérez',
    initials: 'DP',
    roleLabel: 'Técnico',
    email: 'diego.perez@devzen.test',
    password: 'Tecnico123!',
    role: 'TECHNICIAN',
  },
  ADMIN: {
    id: 'demo-ana-gonzalez',
    name: 'Ana González',
    initials: 'AG',
    roleLabel: 'Administrador',
    email: 'ana.gonzalez@devzen.test',
    password: 'Admin123!',
    role: 'ADMIN',
  },
};

interface StoredSession {
  user: AuthenticatedUser;
}

@Injectable({ providedIn: 'root' })
export class PreviewSessionService {
  private readonly storedSession = this.readStoredSession();
  readonly isAuthenticated = signal(this.storedSession !== null);
  readonly user = signal<PreviewUser>(
    this.storedSession ? this.toPreviewUser(this.storedSession.user) : DEMO_USERS.ADMIN,
  );
  readonly role = computed(() => this.user().role);

  login(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();
    const user = Object.values(DEMO_USERS).find(
      (candidate) => candidate.email === normalizedEmail && candidate.password === password
    );

    if (!user) return false;

    this.startSession(user);
    return true;
  }

  loginFromApi(
    user: AuthenticatedUser,
    accessToken: string,
  ): void {
    this.startSession(user, accessToken);
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.user.set(DEMO_USERS.ADMIN);

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
      localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
    }
  }

  private startSession(user: AuthenticatedUser, accessToken?: string): void {
    const previewUser = this.toPreviewUser(user);
    this.user.set(previewUser);
    this.writeStoredSession({ user: this.toAuthenticatedUser(previewUser) });
    this.isAuthenticated.set(true);

    if (accessToken && typeof localStorage !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LEGACY_ROLE_STORAGE_KEY);
    }
  }

  private readStoredSession(): StoredSession | null {
    if (typeof localStorage === 'undefined') return null;

    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;

    try {
      const session = JSON.parse(stored) as Partial<StoredSession>;
      return this.isAuthenticatedUser(session.user) ? { user: session.user } : null;
    } catch {
      return null;
    }
  }

  private writeStoredSession(session: StoredSession): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    }
  }

  private toPreviewUser(user: AuthenticatedUser): PreviewUser {
    return {
      ...user,
      initials: this.getInitials(user.name),
      roleLabel: ROLE_LABELS[user.role],
    };
  }

  private toAuthenticatedUser(user: PreviewUser): AuthenticatedUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private getInitials(name: string): string {
    return name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  private isAuthenticatedUser(user: unknown): user is AuthenticatedUser {
    if (!user || typeof user !== 'object') return false;

    const candidate = user as Partial<AuthenticatedUser>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.email === 'string' &&
      (candidate.role === 'REQUESTER' ||
        candidate.role === 'TECHNICIAN' ||
        candidate.role === 'ADMIN')
    );
  }
}
