import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { toast } from '@spartan-ng/brain/sonner';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { CreateTicketRequest, TicketDetail } from '../../../core/tickets/ticket.models';
import { CreateTicketPageComponent } from './create-ticket-page.component';

describe('CreateTicketPageComponent', () => {
  let gateway: {
    createTicket: ReturnType<typeof vi.fn>;
    listLocations: ReturnType<typeof vi.fn>;
    listAssets: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    gateway = {
      listLocations: vi.fn(() => of({ items: [{ id: 'location-id', code: 'LXN-P1', name: 'Planta 1' }], total: 1 })),
      listAssets: vi.fn(() => of({ items: [{ id: 'asset-id', assetCode: 'LXN-001', name: 'Excavadora EX-04', brand: 'Atlas', model: 'EX-04', serialNumber: 'AT-EX04-001', category: 'Excavadora', locationId: 'location-id', hasOpenTicket: false }], total: 1 })),
      createTicket: vi.fn(() =>
        of({
          id: '54f1c1b7-2acf-4428-a2f7-58b2943fb044',
          description: 'No inicia el sistema hidráulico.',
          location: 'Planta 2',
          asset: 'Excavadora EX-04',
          status: 'NEW',
          priority: 'CRITICAL',
          requester: { id: 'requester-id', name: 'Camila Rojas' },
          createdAt: '2026-08-26T12:00:00.000Z',
          updatedAt: '2026-08-26T12:00:00.000Z',
          impactAssessment: {
            safetyRisk: false,
            equipmentStopped: 'NO',
            productionImpact: 'NONE',
            workaroundAvailable: true,
            affectsOtherAreas: false,
            calculatedPriority: 'CRITICAL',
          },
          currentTechnician: null,
          resolvedBy: null,
          resolvedAt: null,
          closedBy: null,
          closedAt: null,
          assignments: [],
          freezeRequests: [],
          maintenance: null,
          finalEvidence: [],
          history: [],
        } satisfies TicketDetail)
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CreateTicketPageComponent],
    })
      .overrideComponent(CreateTicketPageComponent, {
        set: {
          providers: [{ provide: TICKET_GATEWAY, useValue: gateway }],
        },
      })
      .compileComponents();
  });

  function createComponent() {
    const fixture = TestBed.createComponent(CreateTicketPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function fillValidForm(component: CreateTicketPageComponent): void {
    component.form.setValue({
      description: 'No inicia el sistema hidráulico.',
      locationId: 'location-id',
      assetId: 'asset-id',
      impactAssessment: {
        safetyRisk: false,
        equipmentStopped: 'NO',
        productionImpact: 'NONE',
        workaroundAvailable: true,
        affectsOtherAreas: false,
      },
    });
  }

  it('no envía una solicitud incompleta y resalta todos los campos requeridos', () => {
    const fixture = createComponent();

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(gateway.createTicket).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('La descripción es obligatoria.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona una respuesta.');
    expect(fixture.nativeElement.querySelectorAll('.border-destructive').length).toBeGreaterThan(0);
  });

  it('no muestra errores requeridos solo por enfocar y abandonar un campo vacío', () => {
    const fixture = createComponent();
    const description = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;

    description.dispatchEvent(new FocusEvent('focus'));
    description.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('La descripción es obligatoria.');
    expect(description.classList.contains('border-destructive')).toBe(false);
  });

  it('busca máquinas solo por código y deriva la ubicación y ficha técnica', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const asset = fixture.nativeElement.querySelector('#asset') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;

    expect(asset.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(fixture.nativeElement.querySelector('#location')).toBeNull();

    asset.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options')).toBeNull();

    asset.value = 'excavadora';
    asset.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options')?.textContent).toContain('No encontramos máquinas activas con ese código.');

    asset.value = 'LXN-001';
    asset.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options')).not.toBeNull();

    component.selectAsset(component.assets()[0]);
    fixture.detectChanges();
    expect(component.form.controls.assetId.value).toBe('asset-id');
    expect(component.form.controls.locationId.value).toBe('location-id');
    expect(fixture.nativeElement.textContent).toContain('Planta 1');
    expect(fixture.nativeElement.textContent).toContain('Atlas');
    expect(fixture.nativeElement.textContent).toContain('AT-EX04-001');

    asset.value = '   ';
    asset.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options')).toBeNull();
    expect(component.form.controls.assetId.value).toBeNull();
    expect(component.form.controls.locationId.value).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Ficha de la máquina');
  });

  it('shows the global open-ticket badge and disables only occupied suggestions', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    const freeAsset = component.assets()[0];
    component.assets.set([
      { ...freeAsset, id: 'busy-asset', assetCode: 'LXN-002', hasOpenTicket: true },
      freeAsset,
    ]);
    const input = fixture.nativeElement.querySelector('#asset') as HTMLInputElement;
    input.value = 'LXN';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('#asset-options button') as NodeListOf<HTMLButtonElement>;
    expect(options).toHaveLength(2);
    expect(options[0].querySelector('[hlmBadge]')?.textContent).toContain('Solicitud en curso');
    expect(options[0].disabled).toBe(true);
    expect(options[0].parentElement?.getAttribute('aria-disabled')).toBe('true');
    options[0].click();
    expect(component.form.controls.assetId.value).toBeNull();
    expect(options[1].disabled).toBe(false);
    expect(options[1].querySelector('[hlmBadge]')).toBeNull();
    options[1].click();
    expect(component.form.controls.assetId.value).toBe('asset-id');
    expect(component.form.controls.locationId.value).toBe('location-id');
  });

  it('does not select an occupied asset with Enter or submit it through form values', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.assets.set([{ ...component.assets()[0], hasOpenTicket: true }]);
    component.updateAssetQuery('LXN-001');
    component.handleAutocompleteKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(component.form.controls.assetId.value).toBeNull();
    fillValidForm(component);
    component.submit();
    expect(gateway.createTicket).not.toHaveBeenCalled();
    expect(component.submitError()).toContain('sin una solicitud en curso');
  });

  it('reports an outdated catalog contract instead of silently hiding all badges', () => {
    gateway.listAssets.mockReturnValue(of({ items: [{ id: 'old-api-asset' }], total: 1 }));
    const fixture = createComponent();
    expect(fixture.componentInstance.catalogError()).toContain('Actualiza la API');
    expect(fixture.componentInstance.assets()).toEqual([]);
    expect((fixture.nativeElement.querySelector('#asset') as HTMLInputElement).disabled).toBe(true);
  });

  it('refreshes availability when starting another request after creation', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);
    component.submit();
    gateway.listAssets.mockReturnValue(of({ items: [{ ...component.assets()[0], hasOpenTicket: true }], total: 1 }));
    component.startNewTicket();
    expect(gateway.listAssets).toHaveBeenCalledTimes(2);
    component.updateAssetQuery('LXN');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options [hlmBadge]')?.textContent).toContain('Solicitud en curso');
  });

  it('envía el payload completo y muestra la prioridad respondida en español', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);
    fixture.detectChanges();

    expect(component.form.valid).toBe(true);
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);

    component.submit();
    fixture.detectChanges();

    expect(gateway.createTicket).toHaveBeenCalledWith({
      description: 'No inicia el sistema hidráulico.',
      assetId: 'asset-id',
      impactAssessment: {
        safetyRisk: false,
        equipmentStopped: 'NO',
        productionImpact: 'NONE',
        workaroundAvailable: true,
        affectsOtherAreas: false,
      },
    } satisfies CreateTicketRequest);
    const detailButton = (Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]')) as HTMLButtonElement[])
      .find((button) => button.textContent?.includes('Ver detalle')) as HTMLButtonElement;
    detailButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('Crítica');
    expect(dialog?.textContent).toContain('Nueva');
  });

  it('muestra una confirmación flotante y descartable al crear la solicitud', () => {
    const toastSuccess = vi.spyOn(toast, 'success');
    const created = vi.fn();
    const fixture = createComponent();
    const component = fixture.componentInstance;
    component.created.subscribe(created);
    fillValidForm(component);

    component.submit();

    expect(toastSuccess).toHaveBeenCalledWith('Solicitud creada', expect.objectContaining({
      description: 'El ticket 54f1c1b7-2acf-4428-a2f7-58b2943fb044 fue registrado correctamente.',
      action: expect.objectContaining({ label: 'Descartar' }),
    }));
    expect(created).toHaveBeenCalledWith(expect.objectContaining({
      id: '54f1c1b7-2acf-4428-a2f7-58b2943fb044',
    }));
    toastSuccess.mockRestore();
  });

  it('bloquea duplicados después de crear y permite iniciar una nueva solicitud', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    component.submit();
    fixture.detectChanges();

    expect(gateway.createTicket).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    expect(component.form.disabled).toBe(true);
    expect(component.isDetailOpen()).toBe(false);

    const newTicketButton = (Array.from(fixture.nativeElement.querySelectorAll('button[type="button"]')) as HTMLButtonElement[])
      .find((button) => button.textContent?.includes('Nueva solicitud')) as HTMLButtonElement;
    newTicketButton.click();
    fixture.detectChanges();

    expect(component.createdTicket()).toBeNull();
    expect(component.form.enabled).toBe(true);
    expect(component.form.pristine).toBe(true);
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('abre el detalle reutilizable del ticket creado y permite cerrarlo', async () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    const dialog = document.body.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('54f1c1b7-2acf-4428-a2f7-58b2943fb044');
    expect(dialog?.textContent).toContain('No inicia el sistema hidráulico.');
    expect(dialog?.textContent).toContain('No, continúa funcionando');
    expect(dialog?.textContent).toContain('No afecta la producción');
    expect(fixture.nativeElement.querySelector('app-ticket-detail-modal')).not.toBeNull();

    (dialog?.querySelector('button[hlmSheetClose]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.querySelector('[role="dialog"]')).toBeNull();
  });

  it('evita envíos duplicados mientras la solicitud está pendiente', () => {
    const pendingResponse = new Subject<TicketDetail>();
    gateway.createTicket.mockReturnValue(pendingResponse.asObservable());
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    component.submit();

    expect(gateway.createTicket).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);

    pendingResponse.next({
      id: '54f1c1b7-2acf-4428-a2f7-58b2943fb045',
      description: 'No inicia el sistema hidráulico.',
      location: 'Planta 2',
      asset: 'Excavadora EX-04',
      status: 'NEW',
      priority: 'LOW',
      requester: { id: 'requester-id', name: 'Camila Rojas' },
      createdAt: '2026-08-26T12:00:00.000Z',
      updatedAt: '2026-08-26T12:00:00.000Z',
      impactAssessment: {
        safetyRisk: false,
        equipmentStopped: 'NO',
        productionImpact: 'NONE',
        workaroundAvailable: true,
        affectsOtherAreas: false,
        calculatedPriority: 'LOW',
      },
      currentTechnician: null,
      resolvedBy: null,
      resolvedAt: null,
      closedBy: null,
      closedAt: null,
      assignments: [],
      freezeRequests: [],
      maintenance: null,
      finalEvidence: [],
      history: [],
    });
    pendingResponse.complete();

    expect(component.isSubmitting()).toBe(false);
  });

  it('muestra un error recuperable si el gateway falla', () => {
    const toastError = vi.spyOn(toast, 'error');
    gateway.createTicket.mockReturnValue(
      throwError(() => new Error('El backend no está disponible')) as Observable<TicketDetail>
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible crear la solicitud. Revisa tus datos e inténtalo nuevamente.'
    );
    expect(toastError).toHaveBeenCalledWith(
      'No pudimos crear la solicitud',
      expect.objectContaining({
        description: 'No fue posible crear la solicitud. Revisa tus datos e inténtalo nuevamente.',
      })
    );
    toastError.mockRestore();
  });
});
