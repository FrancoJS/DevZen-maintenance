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
      listAssets: vi.fn(() => of({ items: [{ id: 'asset-id', assetCode: 'LXN-001', name: 'Excavadora EX-04', brand: 'Atlas', model: 'EX-04', serialNumber: 'AT-EX04-001', category: 'Excavadora', locationId: 'location-id' }], total: 1 })),
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
    const location = fixture.nativeElement.querySelector('#location') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector('#description') as HTMLTextAreaElement;

    expect(asset.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(location.readOnly).toBe(true);

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
    expect(location.value).toContain('Planta 1');
    expect(fixture.nativeElement.textContent).toContain('Atlas');
    expect(fixture.nativeElement.textContent).toContain('AT-EX04-001');

    asset.value = '   ';
    asset.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#asset-options')).toBeNull();
    expect(component.form.controls.assetId.value).toBeNull();
    expect(component.form.controls.locationId.value).toBeNull();
    expect(location.value).toBe('');
  });

  it('envía el payload completo y muestra la prioridad respondida en español', () => {
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
    expect(fixture.nativeElement.textContent).toContain('Crítica');
    expect(fixture.nativeElement.textContent).toContain('Nueva');
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

  it('abre el detalle reutilizable del ticket creado y permite cerrarlo', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('54f1c1b7-2acf-4428-a2f7-58b2943fb044');
    expect(fixture.nativeElement.textContent).toContain('No inicia el sistema hidráulico.');
    expect(fixture.nativeElement.textContent).toContain('No, continúa funcionando');
    expect(fixture.nativeElement.textContent).toContain('No afecta la producción');
    expect(fixture.nativeElement.querySelector('app-ticket-detail-modal')).not.toBeNull();

    (fixture.nativeElement.querySelector('button[aria-label="Cerrar detalle del ticket"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
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
