import { Component, computed, inject, OnInit, signal, ViewChild } from '@angular/core';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { TicketDetail, TicketPriority, TicketStatus, TicketSummary } from '../../../core/tickets/ticket.models';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../../shared/tickets/ticket-labels';
import { CreateTicketPageComponent } from '../create-ticket/create-ticket-page.component';

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

const TICKET_PRIORITIES: TicketPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

@Component({
  selector: 'app-my-requests-page',
  imports: [CreateTicketPageComponent, HlmBadgeImports, HlmButtonImports, HlmCardImports],
  providers: [HttpTicketGateway, { provide: TICKET_GATEWAY, useExisting: HttpTicketGateway }],
  templateUrl: './my-requests-page.component.html',
})
export class MyRequestsPageComponent implements OnInit {
  private readonly ticketGateway = inject<TicketGateway>(TICKET_GATEWAY);

  @ViewChild(CreateTicketPageComponent)
  readonly createTicketPage?: CreateTicketPageComponent;

  readonly tickets = signal<TicketSummary[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly query = signal('');
  readonly selectedStatus = signal<TicketStatus | ''>('');
  readonly selectedPriority = signal<TicketPriority | ''>('');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly isCreateModalOpen = signal(false);
  readonly statuses = TICKET_STATUSES;
  readonly priorities = TICKET_PRIORITIES;
  readonly filteredTickets = computed(() => {
    const query = this.query().trim().toLocaleLowerCase('es-CL');

    return this.tickets()
      .filter((ticket) =>
        !query ||
        `${ticket.id} ${ticket.asset}`.toLocaleLowerCase('es-CL').includes(query)
      );
  });
  readonly hasActiveFilters = computed(
    () => Boolean(this.query().trim() || this.selectedStatus() || this.selectedPriority())
  );

  ngOnInit(): void {
    this.loadTickets();
  }

  loadTickets(): void {
    if (this.isLoading() && this.loadError()) {
      return;
    }

    this.isLoading.set(true);
    this.loadError.set(null);

    this.ticketGateway
      .listMyTickets({
        page: this.page(),
        limit: this.pageSize,
        status: this.selectedStatus() || undefined,
        priority: this.selectedPriority() || undefined,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ items, total, totalPages }) => {
          this.tickets.set(items);
          this.total.set(total);
          this.totalPages.set(totalPages);
        },
        error: () => {
          this.tickets.set([]);
          this.total.set(0);
          this.totalPages.set(0);
          this.loadError.set(
            'No fue posible cargar tus solicitudes. Inténtalo nuevamente.'
          );
        },
      });
  }

  updateQuery(query: string): void {
    this.query.set(query);
  }

  updateStatus(status: TicketStatus | ''): void {
    this.selectedStatus.set(status);
    this.page.set(1);
    this.loadTickets();
  }

  updatePriority(priority: TicketPriority | ''): void {
    this.selectedPriority.set(priority);
    this.page.set(1);
    this.loadTickets();
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.page.set(1);
    this.loadTickets();
  }

  previousPage(): void {
    if (this.page() <= 1) return;
    this.page.update((page) => page - 1);
    this.loadTickets();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((page) => page + 1);
    this.loadTickets();
  }

  openCreateModal(): void {
    this.isCreateModalOpen.set(true);
  }

  closeCreateModal(): void {
    if (this.createTicketPage?.isSubmitting()) return;

    this.createTicketPage?.startNewTicket();
    this.isCreateModalOpen.set(false);
  }

  onTicketCreated(ticket: TicketDetail): void {
    this.query.set('');
    this.selectedStatus.set('');
    this.selectedPriority.set('');
    this.page.set(1);

    const nextTotal = this.total() + 1;
    this.tickets.update((tickets) => [this.toSummary(ticket), ...tickets].slice(0, this.pageSize));
    this.total.set(nextTotal);
    this.totalPages.set(Math.ceil(nextTotal / this.pageSize));
    this.closeCreateModal();
    this.loadTickets();
  }

  statusLabel(status: TicketSummary['status']): string {
    return STATUS_LABELS[status];
  }

  priorityLabel(priority: TicketSummary['priority']): string {
    return PRIORITY_LABELS[priority];
  }

  formatDate(createdAt: string): string {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(createdAt));
  }

  statusClass(status: TicketSummary['status']): string {
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

  priorityClass(priority: TicketSummary['priority']): string {
    return {
      LOW: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200',
      MEDIUM: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
      HIGH: 'border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200',
      CRITICAL: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
    }[priority];
  }

  private toSummary(ticket: TicketDetail): TicketSummary {
    return {
      id: ticket.id,
      description: ticket.description,
      location: ticket.location,
      asset: ticket.asset,
      status: ticket.status,
      priority: ticket.priority,
      requester: ticket.requester,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }
}
