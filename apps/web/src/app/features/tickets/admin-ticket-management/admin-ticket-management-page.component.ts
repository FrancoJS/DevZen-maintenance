import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { finalize, forkJoin } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { AdminTicketDetailPageComponent } from '../admin-ticket-detail/admin-ticket-detail-page.component';
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
];

const TICKET_PRIORITIES: TicketPriority[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
];

@Component({
  selector: 'app-admin-ticket-management-page',
  imports: [
    HlmBadgeImports,
    HlmButtonImports,
    HlmCardImports,
    AdminTicketDetailPageComponent,
  ],
  providers: [
    HttpTicketGateway,
    { provide: ADMIN_TICKET_GATEWAY, useExisting: HttpTicketGateway },
  ],
  templateUrl: './admin-ticket-management-page.component.html',
  styleUrl: './admin-ticket-management-page.component.css',
})
export class AdminTicketManagementPageComponent implements OnInit, OnDestroy {
  private readonly gateway = inject<AdminTicketGateway>(ADMIN_TICKET_GATEWAY);
  private readonly document = inject(DOCUMENT);
  private actionCloseTimer?: ReturnType<typeof setTimeout>;
  private previousBodyOverflow = '';

  readonly tickets = signal<TicketSummary[]>([]);
  readonly technicians = signal<Technician[]>([]);
  readonly isLoading = signal(true);
  readonly hasLoadedOnce = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly selectedStatus = signal<TicketStatus | ''>('');
  readonly selectedPriority = signal<TicketPriority | ''>('');
  readonly selectedAssignment = signal<AssignmentFilter>('');
  readonly ticketsExpanded = signal(false);
  readonly techniciansExpanded = signal(false);
  readonly selectedActionTicket = signal<TicketSummary | null>(null);
  readonly isActionsModalOpen = signal(false);
  readonly isActionsModalClosing = signal(false);
  readonly closureSuccess = signal<string | null>(null);
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
  readonly activeTickets = computed(() =>
    this.tickets().filter((ticket) => ticket.status !== 'CLOSED')
  );
  readonly filteredTickets = computed(() => {
    const assignment = this.selectedAssignment();
    if (!assignment) return this.activeTickets();

    return this.activeTickets().filter((ticket) => {
      const hasTechnician = this.hasCurrentTechnician(ticket);
      return assignment === 'WITH_TECHNICIAN' ? hasTechnician : !hasTechnician;
    });
  });
  readonly filteredTechnicians = computed(() => {
    const status = this.selectedStatus();
    const priority = this.selectedPriority();
    const assignment = this.selectedAssignment();

    return this.technicians().filter((technician) => {
      const currentTicket = technician.currentTicket;
      const hasCurrentTicket = currentTicket !== null;

      if (
        (assignment === 'WITH_TECHNICIAN' && !hasCurrentTicket) ||
        (assignment === 'WITHOUT_TECHNICIAN' && hasCurrentTicket)
      ) {
        return false;
      }

      return (
        (!status || currentTicket?.status === status) &&
        (!priority || currentTicket?.priority === priority)
      );
    });
  });

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.actionCloseTimer) clearTimeout(this.actionCloseTimer);
    this.restoreDocumentScroll();
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
          this.hasLoadedOnce.set(true);
        },
        error: () => {
          this.tickets.set([]);
          this.technicians.set([]);
          this.hasLoadedOnce.set(true);
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

  toggleTicketsSection(): void {
    this.ticketsExpanded.update((expanded) => !expanded);
  }

  toggleTechniciansSection(): void {
    this.techniciansExpanded.update((expanded) => !expanded);
  }

  openActions(ticket: TicketSummary): void {
    if (this.actionCloseTimer) clearTimeout(this.actionCloseTimer);
    this.selectedActionTicket.set(ticket);
    this.closureSuccess.set(null);
    this.isActionsModalClosing.set(false);
    this.isActionsModalOpen.set(true);
    this.previousBodyOverflow = this.document.body.style.overflow;
    this.document.body.style.overflow = 'hidden';
  }

  closeActions(): void {
    if (!this.isActionsModalOpen() || this.isActionsModalClosing()) return;
    this.isActionsModalClosing.set(true);
    this.actionCloseTimer = setTimeout(() => {
      this.isActionsModalOpen.set(false);
      this.isActionsModalClosing.set(false);
      this.selectedActionTicket.set(null);
      this.restoreDocumentScroll();
    }, 220);
  }


  clearFilters(): void {
    const requiresReload = Boolean(this.selectedStatus() || this.selectedPriority());
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.selectedAssignment.set('');
    if (requiresReload) this.loadData();
  }

  handleTicketClosed(ticketId: string): void {
    this.tickets.update((tickets) =>
      tickets.filter((ticket) => ticket.id !== ticketId)
    );
    this.closureSuccess.set(
      'El ticket fue cerrado y se retiró de Gestión de tickets.'
    );
    this.closeActions();
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

  private restoreDocumentScroll(): void {
    this.document.body.style.overflow = this.previousBodyOverflow;
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
