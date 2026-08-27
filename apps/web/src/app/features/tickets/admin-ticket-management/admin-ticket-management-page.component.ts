import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import {
  ADMIN_TICKET_GATEWAY,
  AdminTicketGateway,
} from '../../../core/tickets/ticket.gateway';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import {
  Technician,
  TicketPriority,
  TicketStatus,
  TicketSummary,
} from '../../../core/tickets/ticket.models';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '../../../shared/tickets/ticket-labels';

type AssignmentFilter = '' | 'WITH_TECHNICIAN' | 'WITHOUT_TECHNICIAN';

const ACTIVE_ASSIGNMENT_STATUSES: TicketStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'FREEZE_REQUESTED',
];

const TICKET_STATUSES: TicketStatus[] = [
  'NEW',
  'ASSIGNED',
  'IN_PROGRESS',
  'FREEZE_REQUESTED',
  'FROZEN',
  'PENDING_REASSIGNMENT',
  'RESOLVED',
  'CLOSED',
];

const TICKET_PRIORITIES: TicketPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

@Component({
  selector: 'app-admin-ticket-management-page',
  imports: [RouterLink, HlmBadgeImports, HlmButtonImports, HlmCardImports],
  providers: [
    HttpTicketGateway,
    { provide: ADMIN_TICKET_GATEWAY, useExisting: HttpTicketGateway },
  ],
  templateUrl: './admin-ticket-management-page.component.html',
})
export class AdminTicketManagementPageComponent implements OnInit {
  private readonly gateway = inject<AdminTicketGateway>(ADMIN_TICKET_GATEWAY);

  readonly tickets = signal<TicketSummary[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly selectedStatus = signal<TicketStatus | ''>('');
  readonly selectedPriority = signal<TicketPriority | ''>('');
  readonly selectedAssignment = signal<AssignmentFilter>('');
  readonly statuses = TICKET_STATUSES;
  readonly priorities = TICKET_PRIORITIES;

  readonly availableTechnicians = computed(
    () => this.technicians().filter(({ availability }) => availability === 'AVAILABLE').length
  );
  readonly busyTechnicians = computed(
    () => this.technicians().filter(({ availability }) => availability === 'BUSY').length
  );
  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.selectedStatus() ||
        this.selectedPriority() ||
        this.selectedAssignment()
    )
  );
  readonly filteredTickets = computed(() => {
    const assignment = this.selectedAssignment();
    if (!assignment) return this.tickets();

    return this.tickets().filter((ticket) => {
      const hasTechnician = this.hasCurrentTechnician(ticket);
      return assignment === 'WITH_TECHNICIAN' ? hasTechnician : !hasTechnician;
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    if (this.isLoading() && this.loadError()) return;

    this.isLoading.set(true);
    this.loadError.set(null);

    forkJoin({
      tickets: this.gateway.listTickets({
        status: this.selectedStatus() || undefined,
        priority: this.selectedPriority() || undefined,
      }),
      technicians: this.gateway.listTechnicians(),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ tickets, technicians }) => {
          this.tickets.set(tickets.items);
          this.technicians.set(technicians.items);
        },
        error: () => {
          this.tickets.set([]);
          this.technicians.set([]);
          this.loadError.set(
            'No fue posible cargar los tickets y la disponibilidad del equipo.'
          );
        },
      });
  }

  updateStatus(status: TicketStatus | ''): void {
    this.selectedStatus.set(status);
    this.loadData();
  }

  updatePriority(priority: TicketPriority | ''): void {
    this.selectedPriority.set(priority);
    this.loadData();
  }

  updateAssignment(assignment: AssignmentFilter): void {
    this.selectedAssignment.set(assignment);
  }

  clearFilters(): void {
    const requiresReload = Boolean(this.selectedStatus() || this.selectedPriority());
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.selectedAssignment.set('');
    if (requiresReload) this.loadData();
  }

  technicianName(ticket: TicketSummary): string {
    if (!this.hasCurrentTechnician(ticket)) return 'Sin técnico actual';

    return (
      this.technicians().find(
        (technician) => technician.currentTicket?.id === ticket.id
      )?.name ?? 'Técnico asignado'
    );
  }

  hasCurrentTechnician(ticket: TicketSummary): boolean {
    return ACTIVE_ASSIGNMENT_STATUSES.includes(ticket.status);
  }

  statusLabel(status: TicketStatus): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketPriority): string {
    return PRIORITY_LABELS[priority];
  }

  formatDate(createdAt: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(createdAt));
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
