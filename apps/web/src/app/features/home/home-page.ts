import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { PreviewSessionService } from '../../core/preview-session.service';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, HlmBadgeImports, HlmButtonImports, HlmCardImports],
  template: `
    <section class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p class="text-sm text-muted-foreground">{{ session.user().roleLabel }} / Panel principal</p>
          <h2 class="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Hola, {{ session.user().name.split(' ')[0] }}</h2>
          <p class="mt-1 text-muted-foreground">Resumen de actividad y próximos pasos.</p>
        </div>
        <span hlmBadge variant="secondary" class="w-fit">Datos de demostración</span>
      </header>

      @if (session.role() === 'REQUESTER') {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article hlmCard class="border-l-4 border-l-primary"><div hlmCardHeader><p hlmCardDescription>Total de solicitudes</p><p hlmCardTitle class="text-3xl">24</p></div></article>
          <article hlmCard class="border-l-4 border-l-blue-500"><div hlmCardHeader><p hlmCardDescription>Nuevas / asignadas</p><p hlmCardTitle class="text-3xl">6</p></div></article>
          <article hlmCard class="border-l-4 border-l-amber-500"><div hlmCardHeader><p hlmCardDescription>En proceso</p><p hlmCardTitle class="text-3xl">4</p></div></article>
          <article hlmCard class="border-l-4 border-l-emerald-500"><div hlmCardHeader><p hlmCardDescription>Cerradas</p><p hlmCardTitle class="text-3xl">14</p></div></article>
        </div>
        <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <article hlmCard><header hlmCardHeader><h3 hlmCardTitle>Solicitudes recientes</h3><p hlmCardDescription>Últimos requerimientos enviados.</p></header><div hlmCardContent class="space-y-3"><div class="flex items-center justify-between rounded-lg border p-3"><div><p class="font-medium">Revisión de bomba hidráulica</p><p class="text-sm text-muted-foreground">#SOL-1024 · Hace 2 horas</p></div><span hlmBadge variant="secondary">Asignada</span></div><div class="flex items-center justify-between rounded-lg border p-3"><div><p class="font-medium">Cambio de luminaria</p><p class="text-sm text-muted-foreground">#SOL-1021 · Ayer</p></div><span hlmBadge variant="outline">En proceso</span></div></div></article>
          <article hlmCard class="bg-primary text-primary-foreground"><header hlmCardHeader><h3 hlmCardTitle class="text-primary-foreground">¿Necesitas ayuda?</h3><p hlmCardDescription class="text-blue-100">Registra una nueva solicitud para que el equipo pueda atenderla.</p></header><div hlmCardContent><a hlmBtn variant="secondary" routerLink="/crear-solicitud">Crear solicitud</a></div></article>
        </div>
      }

      @if (session.role() === 'TECHNICIAN') {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article hlmCard class="border-l-4 border-l-emerald-500"><div hlmCardHeader><p hlmCardDescription>Estado actual</p><p hlmCardTitle class="text-xl">Disponible</p></div></article>
          <article hlmCard class="border-l-4 border-l-primary"><div hlmCardHeader><p hlmCardDescription>Mantención actual</p><p hlmCardTitle class="text-3xl">1</p></div></article>
          <article hlmCard class="border-l-4 border-l-blue-500"><div hlmCardHeader><p hlmCardDescription>Resueltas este mes</p><p hlmCardTitle class="text-3xl">18</p></div></article>
          <article hlmCard class="border-l-4 border-l-amber-500"><div hlmCardHeader><p hlmCardDescription>Próximas asignaciones</p><p hlmCardTitle class="text-3xl">3</p></div></article>
        </div>
        <article hlmCard><header hlmCardHeader><div class="flex flex-wrap items-center justify-between gap-3"><div><h3 hlmCardTitle>Ticket asignado</h3><p hlmCardDescription>Prioridad y datos de la intervención activa.</p></div><span hlmBadge class="bg-amber-100 text-amber-800 hover:bg-amber-100">Prioridad alta</span></div></header><div hlmCardContent class="grid gap-4 sm:grid-cols-3"><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Ticket</p><p class="mt-1 font-semibold">#TCK-2048</p></div><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Máquina</p><p class="mt-1 font-semibold">Compresor C-12</p></div><div><p class="text-xs uppercase tracking-wide text-muted-foreground">Estado</p><span hlmBadge variant="secondary" class="mt-1">En proceso</span></div></div><footer hlmCardFooter><a hlmBtn routerLink="/mi-mantencion">Ver mi mantención</a></footer></article>
      }

      @if (session.role() === 'ADMIN') {
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article hlmCard class="border-l-4 border-l-primary"><div hlmCardHeader><p hlmCardDescription>Tickets nuevos</p><p hlmCardTitle class="text-3xl">12</p></div></article>
          <article hlmCard class="border-l-4 border-l-red-500"><div hlmCardHeader><p hlmCardDescription>Tickets críticos</p><p hlmCardTitle class="text-3xl">3</p></div></article>
          <article hlmCard class="border-l-4 border-l-amber-500"><div hlmCardHeader><p hlmCardDescription>En proceso</p><p hlmCardTitle class="text-3xl">21</p></div></article>
          <article hlmCard class="border-l-4 border-l-slate-500"><div hlmCardHeader><p hlmCardDescription>Congelados</p><p hlmCardTitle class="text-3xl">5</p></div></article>
        </div>
        <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <article hlmCard><header hlmCardHeader><h3 hlmCardTitle>Técnicos</h3><p hlmCardDescription>Disponibilidad del equipo.</p></header><div hlmCardContent class="flex items-center justify-around"><div class="text-center"><p class="text-3xl font-bold text-emerald-600">8</p><p class="text-sm text-muted-foreground">Disponibles</p></div><div class="text-center"><p class="text-3xl font-bold text-amber-600">4</p><p class="text-sm text-muted-foreground">Ocupados</p></div></div></article>
          <article hlmCard><header hlmCardHeader><h3 hlmCardTitle>Tickets críticos recientes</h3><p hlmCardDescription>Requieren seguimiento prioritario.</p></header><div hlmCardContent class="space-y-3"><div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p class="font-medium">Falla en línea de producción</p><p class="text-sm text-muted-foreground">#TCK-2048 · Compresor C-12</p></div><span hlmBadge class="bg-red-100 text-red-800 hover:bg-red-100">Crítico</span></div><div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"><div><p class="font-medium">Temperatura fuera de rango</p><p class="text-sm text-muted-foreground">#TCK-2041 · Horno industrial</p></div><span hlmBadge class="bg-orange-100 text-orange-800 hover:bg-orange-100">Alta</span></div></div></article>
        </div>
      }
    </section>
  `,
})
export class HomePage {
  protected readonly session = inject(PreviewSessionService);
}
