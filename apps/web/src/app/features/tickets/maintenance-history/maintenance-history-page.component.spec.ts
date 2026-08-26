import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { MaintenanceHistoryPageComponent } from './maintenance-history-page.component';

async function createComponent(scope: 'personal' | 'global') {
  await TestBed.configureTestingModule({
    imports: [MaintenanceHistoryPageComponent],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { data: { historyScope: scope } } },
      },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(MaintenanceHistoryPageComponent);
  fixture.detectChanges();
  return fixture;
}

describe('MaintenanceHistoryPageComponent', () => {
  it('muestra al técnico solo las mantenciones en las que participó', async () => {
    const fixture = await createComponent('personal');
    const component = fixture.componentInstance;

    expect(component.records().map((record) => record.ticketId)).toEqual([
      'TCK-2037',
      'TCK-2048',
      'TCK-2019',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Historial de mantenciones');
    expect(fixture.nativeElement.textContent).not.toContain('Bomba hidráulica B-07');
  });

  it('muestra al administrador el historial global y el filtro de técnico', async () => {
    const fixture = await createComponent('global');
    const component = fixture.componentInstance;

    expect(component.records()).toHaveLength(5);
    expect(fixture.nativeElement.textContent).toContain('Historial global de mantenciones');
    expect(fixture.nativeElement.querySelector('#history-technician')).not.toBeNull();
  });

  it('combina búsqueda, estado, prioridad y técnico', async () => {
    const fixture = await createComponent('global');
    const component = fixture.componentInstance;

    component.updateQuery('transportador');
    component.updateStatus('CLOSED');
    component.updatePriority('MEDIUM');
    component.updateTechnician('tech-valentina-silva');

    expect(component.records().map((record) => record.ticketId)).toEqual(['TCK-2019']);
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('restablece los filtros y muestra un estado vacío cuando no hay coincidencias', async () => {
    const fixture = await createComponent('personal');
    const component = fixture.componentInstance;

    component.updateQuery('equipo inexistente');
    fixture.detectChanges();
    expect(component.records()).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No encontramos mantenciones con esos criterios.');

    component.clearFilters();
    fixture.detectChanges();
    expect(component.records()).toHaveLength(3);
    expect(component.hasActiveFilters()).toBe(false);
  });

  it('abre y cierra el panel lateral con una cronología ordenada', async () => {
    const fixture = await createComponent('personal');
    const component = fixture.componentInstance;
    const record = component.records().find((item) => item.ticketId === 'TCK-2019');

    expect(record).toBeDefined();
    component.openRecord(record!);
    fixture.detectChanges();

    expect(document.body.textContent).toContain('Congelamiento aprobado');
    expect(component.selectedRecord()?.events.map((event) => event.action)).toEqual([
      'CREATED',
      'PRIORITY_CALCULATED',
      'ASSIGNED',
      'STARTED',
      'FREEZE_REQUESTED',
      'FREEZE_APPROVED',
      'BLOCKER_RESOLVED',
      'REASSIGNED',
      'STARTED',
      'RESOLVED',
      'CLOSED',
    ]);

    component.onSheetStateChange('closed');
    expect(component.selectedRecord()).toBeNull();
  });
});
