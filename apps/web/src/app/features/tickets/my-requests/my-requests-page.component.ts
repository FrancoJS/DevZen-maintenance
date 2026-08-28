import { CdkTrapFocus } from '@angular/cdk/a11y';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { createPageArray, HlmPaginationImports } from '@spartan-ng/helm/pagination';
import { HttpTicketGateway } from '../../../core/tickets/http-ticket.gateway';
import { PreviewSessionService } from '../../../core/preview-session.service';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { TicketDetail, TicketPriority, TicketStatus, TicketSummary } from '../../../core/tickets/ticket.models';
import { toast } from '@spartan-ng/brain/sonner';
import { PRIORITY_LABELS, STATUS_LABELS } from '../../../shared/tickets/ticket-labels';
import { CreateTicketPageComponent } from '../create-ticket/create-ticket-page.component';
import { TicketDetailModalComponent } from '../ticket-detail/ticket-detail-modal.component';

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
const STATUS_GROUPS: ReadonlyArray<{ label: string; statuses: TicketStatus[] }> = [
  { label: 'Solicitud y asignación', statuses: ['NEW', 'ASSIGNED'] },
  { label: 'Trabajo y bloqueo', statuses: ['IN_PROGRESS', 'FREEZE_REQUESTED', 'FROZEN', 'PENDING_REASSIGNMENT'] },
  { label: 'Cierre', statuses: ['RESOLVED', 'CLOSED'] },
];

@Component({
  selector: 'app-my-requests-page',
  imports: [CdkTrapFocus, CreateTicketPageComponent, HlmBadgeImports, HlmButtonImports, HlmCardImports, HlmPaginationImports, ReactiveFormsModule, TicketDetailModalComponent],
  providers: [HttpTicketGateway, { provide: TICKET_GATEWAY, useExisting: HttpTicketGateway }],
  templateUrl: './my-requests-page.component.html',
})
export class MyRequestsPageComponent implements OnInit {
  private readonly ticketGateway = inject<TicketGateway>(TICKET_GATEWAY);
  private readonly formBuilder = inject(FormBuilder);
  private readonly session = inject(PreviewSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(CreateTicketPageComponent)
  readonly createTicketPage?: CreateTicketPageComponent;

  readonly tickets = signal<TicketSummary[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly query = signal('');
  readonly selectedStatus = signal<TicketStatus | ''>('');
  readonly selectedPriority = signal<TicketPriority | ''>('');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly total = signal(0);
  readonly totalPages = signal(0);
  readonly isCreateModalOpen = signal(false);
  readonly isDiscardConfirmationOpen = signal(false);
  readonly isDetailOpen = signal(false);
  readonly isDetailLoading = signal(false);
  readonly detailError = signal<string | null>(null);
  readonly ticketDetail = signal<TicketDetail | null>(null);
  readonly detailTicketId = signal<string | null>(null);
  readonly isEditModalOpen = signal(false);
  readonly isSavingEdit = signal(false);
  readonly editError = signal<string | null>(null);
  readonly showEditValidation = signal(false);
  readonly editingTicket = signal<TicketSummary | null>(null);
  readonly editForm = this.formBuilder.nonNullable.group({
    description: ['', [Validators.required, Validators.maxLength(1000)]],
  });
  readonly statuses = TICKET_STATUSES;
  readonly statusGroups = STATUS_GROUPS;
  readonly priorities = TICKET_PRIORITIES;
  readonly pageStart = computed(() => (this.total() ? (this.page() - 1) * this.pageSize + 1 : 0));
  readonly pageEnd = computed(() => Math.min(this.page() * this.pageSize, this.total()));
  readonly pageLinks = computed(() => createPageArray(this.page(), this.pageSize, this.total(), 7));
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
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      if (params.get('create') === '1') {
        this.openCreateModal(true);
      }
    });
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
    if (this.page() <= 1 || this.isLoading()) return;
    this.page.update((page) => page - 1);
    this.loadTickets();
  }

  goToPage(page: number | '...'): void {
    if (page === '...') return;
    if (page < 1 || page > this.totalPages() || page === this.page() || this.isLoading()) return;
    this.page.set(page);
    this.loadTickets();
  }

  nextPage(): void {
    if (this.page() >= this.totalPages() || this.isLoading()) return;
    this.page.update((page) => page + 1);
    this.loadTickets();
  }

  openCreateModal(fromQuery = false): void {
    this.captureFocus('create');
    this.isCreateModalOpen.set(true);
    this.isDiscardConfirmationOpen.set(false);
    if (fromQuery) this.consumeCreateQueryParam();
  }

  closeCreateModal(force = false): void {
    if (!force && this.createTicketPage?.isSubmitting()) return;
    if (!force && this.createTicketPage?.form.dirty && !this.createTicketPage.createdTicket()) {
      this.isDiscardConfirmationOpen.set(true);
      return;
    }

    this.createTicketPage?.startNewTicket();
    this.isDiscardConfirmationOpen.set(false);
    this.isCreateModalOpen.set(false);
    this.restoreFocus('create');
  }

  cancelDiscardCreateForm(): void {
    this.isDiscardConfirmationOpen.set(false);
  }

  discardCreateForm(): void {
    this.closeCreateModal(true);
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
    this.closeCreateModal(true);
    this.loadTickets();
  }

  openTicketDetail(id: string): void {
    this.captureFocus('detail');
    this.isDetailOpen.set(true);
    this.detailTicketId.set(id);
    this.ticketDetail.set(null);
    this.detailError.set(null);
    this.loadTicketDetail(id);
  }

  closeTicketDetail(): void {
    this.isDetailOpen.set(false);
    this.isDetailLoading.set(false);
    this.detailError.set(null);
    this.detailTicketId.set(null);
    this.restoreFocus('detail');
  }

  loadTicketDetail(id: string): void {
    this.isDetailLoading.set(true);
    this.detailError.set(null);

    this.ticketGateway
      .getTicket(id)
      .pipe(finalize(() => this.isDetailLoading.set(false)))
      .subscribe({
        next: (ticket) => this.ticketDetail.set(ticket),
        error: () =>
          this.detailError.set(
            'No fue posible cargar el detalle de esta solicitud. Inténtalo nuevamente.'
          ),
      });
  }

  canEdit(ticket: TicketSummary): boolean {
    return ticket.status === 'NEW' && ticket.requester.id === this.session.user().id;
  }

  openEditModal(ticket: TicketSummary): void {
    if (!this.canEdit(ticket)) return;

    this.editingTicket.set(ticket);
    this.captureFocus('edit');
    this.editError.set(null);
    this.showEditValidation.set(false);
    this.editForm.reset({ description: ticket.description });
    this.isEditModalOpen.set(true);
  }

  closeEditModal(): void {
    if (this.isSavingEdit()) return;

    this.isEditModalOpen.set(false);
    this.editingTicket.set(null);
    this.editError.set(null);
    this.showEditValidation.set(false);
    this.editForm.reset({ description: '' });
    this.restoreFocus('edit');
  }

  submitEdit(): void {
    const ticket = this.editingTicket();
    if (!ticket || this.isSavingEdit()) return;

    this.showEditValidation.set(true);
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;

    this.isSavingEdit.set(true);
    const request = { description: this.editForm.controls.description.value.trim() };

    this.ticketGateway
      .updateTicket(ticket.id, request)
      .pipe(finalize(() => this.isSavingEdit.set(false)))
      .subscribe({
        next: (updatedTicket) => {
          this.tickets.update((tickets) =>
            tickets.map((current) =>
              current.id === updatedTicket.id ? this.toSummary(updatedTicket) : current
            )
          );
          if (this.ticketDetail()?.id === updatedTicket.id) {
            this.ticketDetail.set(updatedTicket);
          }
          toast.success('Solicitud actualizada', {
            description: `El ticket ${updatedTicket.id} fue actualizado correctamente.`,
            duration: 8000,
          });
          this.isSavingEdit.set(false);
          this.closeEditModal();
        },
        error: (error: unknown) => {
          const message = this.editErrorMessage(error);
          this.editError.set(message);
          toast.error('No pudimos actualizar la solicitud', {
            description: message,
            duration: 8000,
          });
          this.loadTickets();
        },
      });
  }

  hasEditError(): boolean {
    return this.editForm.controls.description.invalid && this.showEditValidation();
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

  private editErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'La solicitud cambió de estado y ya no puede editarse. Recargamos la lista para mostrar la información actual.';
    }
    if (error instanceof HttpErrorResponse && error.status === 0) {
      return 'No pudimos contactar al servidor. Conservamos tu texto; revisa la conexión e inténtalo nuevamente.';
    }
    return 'No fue posible actualizar la solicitud. Conservamos tu texto y recargamos la lista para mostrar la información actual.';
  }

  private readonly focusTargets: Record<'create' | 'detail' | 'edit', HTMLElement | null> = {
    create: null,
    detail: null,
    edit: null,
  };

  private captureFocus(target: 'create' | 'detail' | 'edit'): void {
    const active = document.activeElement;
    this.focusTargets[target] = active instanceof HTMLElement ? active : null;
  }

  private restoreFocus(target: 'create' | 'detail' | 'edit'): void {
    const element = this.focusTargets[target];
    this.focusTargets[target] = null;
    queueMicrotask(() => element?.focus());
  }

  private consumeCreateQueryParam(): void {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('create')) return;

    url.searchParams.delete('create');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}
