import { TestBed } from '@angular/core/testing';
import { Observable, Subject, of, throwError } from 'rxjs';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TICKET_GATEWAY, TicketGateway } from '../../../core/tickets/ticket.gateway';
import { CreateTicketRequest, CreateTicketResponse } from '../../../core/tickets/ticket.models';
import { CreateTicketPageComponent } from './create-ticket-page.component';

describe('CreateTicketPageComponent', () => {
  let gateway: { createTicket: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    gateway = {
      createTicket: vi.fn(() =>
        of({
          ticket: {
            id: 'TK-000123',
            status: 'NEW',
            priority: 'CRITICAL',
            createdAt: '2026-08-26T12:00:00.000Z',
          },
        } satisfies CreateTicketResponse)
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
      area: 'Producción',
      location: 'Planta 2',
      asset: 'Excavadora EX-04',
      impactAssessment: {
        safetyRisk: false,
        equipmentStopped: 'NO',
        productionImpact: 'NONE',
        workaroundAvailable: true,
        affectsOtherAreas: false,
      },
    });
  }

  it('no envía una solicitud incompleta y muestra los errores', () => {
    const fixture = createComponent();

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(gateway.createTicket).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('La descripción es obligatoria.');
    expect(fixture.nativeElement.textContent).toContain('Selecciona una respuesta.');
  });

  it('envía el payload completo y muestra la prioridad respondida en español', () => {
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    fixture.detectChanges();

    expect(gateway.createTicket).toHaveBeenCalledWith({
      description: 'No inicia el sistema hidráulico.',
      area: 'Producción',
      location: 'Planta 2',
      asset: 'Excavadora EX-04',
      impactAssessment: {
        safetyRisk: false,
        equipmentStopped: 'NO',
        productionImpact: 'NONE',
        workaroundAvailable: true,
        affectsOtherAreas: false,
      },
    } satisfies CreateTicketRequest);
    expect(fixture.nativeElement.textContent).toContain('Crítica');
    expect(fixture.nativeElement.textContent).toContain('Nueva');
  });

  it('evita envíos duplicados mientras la solicitud está pendiente', () => {
    const pendingResponse = new Subject<CreateTicketResponse>();
    gateway.createTicket.mockReturnValue(pendingResponse.asObservable());
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    component.submit();

    expect(gateway.createTicket).toHaveBeenCalledTimes(1);
    expect(component.isSubmitting()).toBe(true);

    pendingResponse.next({
      ticket: {
        id: 'TK-000124',
        status: 'NEW',
        priority: 'LOW',
        createdAt: '2026-08-26T12:00:00.000Z',
      },
    });
    pendingResponse.complete();

    expect(component.isSubmitting()).toBe(false);
  });

  it('muestra un error recuperable si el gateway falla', () => {
    gateway.createTicket.mockReturnValue(
      throwError(() => new Error('El backend no está disponible')) as Observable<CreateTicketResponse>
    );
    const fixture = createComponent();
    const component = fixture.componentInstance;
    fillValidForm(component);

    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No fue posible crear la solicitud. Revisa tus datos e inténtalo nuevamente.'
    );
  });
});
