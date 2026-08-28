import {
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCirclePlus,
  lucideSnowflake,
  lucideTickets,
  lucideTriangleAlert,
  lucideWrench,
} from '@ng-icons/lucide';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSkeletonImports } from '@spartan-ng/helm/skeleton';
import { HlmTableImports } from '@spartan-ng/helm/table';
import {
  Technician,
  TechnicianAvailability,
  TicketPriority,
  TicketStatus,
} from '../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../shared/tickets/ticket-labels';
import {
  AdminDashboardResponse,
  AdminDashboardService,
} from './admin-dashboard.service';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [
    RouterLink,
    NgIcon,
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    HlmSkeletonImports,
    HlmTableImports,
  ],
  providers: [
    AdminDashboardService,
    provideIcons({
      lucideCirclePlus,
      lucideSnowflake,
      lucideTickets,
      lucideTriangleAlert,
      lucideWrench,
    }),
  ],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.css',
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly service = inject(AdminDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  readonly data = signal<AdminDashboardResponse | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly technicians = signal<Technician[]>([]);
  readonly techniciansPage = signal(1);
  readonly techniciansTotal = signal(0);
  readonly techniciansTotalPages = signal(0);
  readonly techniciansError = signal<string | null>(null);
  readonly isTechniciansLoading = signal(false);
  readonly techniciansPageSize = 10;
  readonly ticketMetrics = computed(() => {
    const tickets = this.data()?.tickets;
    return tickets
      ? [
          {
            label: 'Total de tickets',
            value: tickets.total,
            description: 'Incluye tickets cerrados.',
            tone: 'primary',
            icon: 'lucideTickets',
          },
          {
            label: 'Nuevos',
            value: tickets.new,
            description: 'Solicitudes en estado nuevo.',
            tone: 'secondary',
            icon: 'lucideCirclePlus',
          },
          {
            label: 'Críticos activos',
            value: tickets.critical,
            description: 'Excluye resueltos y cerrados.',
            tone: 'destructive',
            icon: 'lucideTriangleAlert',
          },
          {
            label: 'En proceso',
            value: tickets.inProgress,
            description: 'Mantenciones iniciadas.',
            tone: 'accent',
            icon: 'lucideWrench',
          },
          {
            label: 'Congelados',
            value: tickets.frozen,
            description: 'Bloqueos aprobados pendientes.',
            tone: 'muted',
            icon: 'lucideSnowflake',
          },
        ]
      : [];
  });
  readonly attentionMetrics = computed(() => {
    const attention = this.data()?.requiresAttention;
    return attention
      ? [
          {
            label: 'Por asignar',
            value: attention.pendingAssignment,
            route: '/gestion-tickets',
            action: 'Gestionar asignaciones',
          },
          {
            label: 'Congelamientos por aprobar',
            value: attention.pendingFreezeApproval,
            route: '/congelamientos',
            action: 'Revisar congelamientos',
          },
          {
            label: 'Por reasignar',
            value: attention.pendingReassignment,
            route: '/gestion-tickets',
            action: 'Gestionar reasignaciones',
          },
          {
            label: 'Por cerrar',
            value: attention.pendingClosure,
            route: '/gestion-tickets',
            action: 'Revisar tickets resueltos',
          },
        ]
      : [];
  });

  ngOnInit(): void {
    this.load();
    this.loadTechnicians();
  }

  load(): void {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.service
      .load()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (data) => this.data.set(data),
        error: () =>
          this.error.set(
            'No fue posible cargar los indicadores. Inténtalo nuevamente.',
          ),
      });
  }

  loadTechnicians(page = this.techniciansPage()): void {
    if (this.isTechniciansLoading()) return;

    this.isTechniciansLoading.set(true);
    this.techniciansError.set(null);
    this.service
      .listTechnicians(page, this.techniciansPageSize)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isTechniciansLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          this.technicians.set(response.items);
          this.techniciansPage.set(response.page);
          this.techniciansTotal.set(response.total);
          this.techniciansTotalPages.set(response.totalPages);
        },
        error: () => {
          this.technicians.set([]);
          this.techniciansTotal.set(0);
          this.techniciansTotalPages.set(0);
          this.techniciansError.set(
            'No fue posible cargar los técnicos. Inténtalo nuevamente.',
          );
        },
      });
  }

  goToTechniciansPage(page: number): void {
    if (
      page < 1 ||
      page > this.techniciansTotalPages() ||
      page === this.techniciansPage()
    ) {
      return;
    }

    this.techniciansPage.set(page);
    this.loadTechnicians(page);
  }

  availabilityLabel(availability: TechnicianAvailability): string {
    return availability === 'AVAILABLE' ? 'Disponible' : 'Ocupado';
  }

  availabilityClass(availability: TechnicianAvailability): string {
    return availability === 'AVAILABLE'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
      : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200';
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  statusClass(status: TicketStatus): string {
    return {
      NEW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      ASSIGNED: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-200',
      IN_PROGRESS: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      FREEZE_REQUESTED: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
      FROZEN: 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200',
      PENDING_REASSIGNMENT: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
      CLOSED: 'border-slate-200 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    }[status];
  }

  priorityClass(priority: TicketPriority): string {
    return {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    }[priority];
  }
}
