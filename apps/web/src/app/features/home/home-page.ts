import { Component } from '@angular/core';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-home-page',
  imports: [HlmBadgeImports, HlmButtonImports, HlmCardImports],
  template: `
    <main id="inicio" class="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section class="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <article hlmCard class="w-full max-w-2xl border-border shadow-[0_20px_60px_rgba(28,36,52,0.12)]">
          <header hlmCardHeader class="gap-6 p-6 sm:p-8">
            <div class="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div class="flex items-center gap-4">
                <div class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                  <svg aria-hidden="true" class="size-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a4.5 4.5 0 0 0-5.98 5.98L3 18l3 3 5.72-5.72a4.5 4.5 0 0 0 5.98-5.98l-2.46 2.46-2.02-.5-.5-2.02L14.7 6.3Z" />
                  </svg>
                </div>
                <div>
                  <p class="text-xs font-bold tracking-[0.2em] text-primary">DEVZEN</p>
                  <h1 hlmCardTitle class="mt-1 text-2xl font-bold tracking-tight text-card-foreground">DevZen Maintenance</h1>
                </div>
              </div>
              <span hlmBadge variant="secondary" class="w-fit shrink-0">Interfaz en construcción</span>
            </div>
            <p hlmCardDescription class="max-w-xl text-base text-muted-foreground">Sistema de gestión de mantenimiento</p>
          </header>

          <div hlmCardContent class="px-6 pb-6 sm:px-8">
            <div id="proximas-funcionalidades" class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border bg-muted/45 p-4">
                <p class="text-sm font-semibold text-card-foreground">Reporta</p>
                <p class="mt-1 text-sm text-muted-foreground">Centraliza las solicitudes de mantenimiento.</p>
              </div>
              <div class="rounded-lg border bg-muted/45 p-4">
                <p class="text-sm font-semibold text-card-foreground">Coordina</p>
                <p class="mt-1 text-sm text-muted-foreground">Asigna y da seguimiento a cada ticket.</p>
              </div>
              <div class="rounded-lg border bg-muted/45 p-4">
                <p class="text-sm font-semibold text-card-foreground">Resuelve</p>
                <p class="mt-1 text-sm text-muted-foreground">Mantiene el historial de las intervenciones.</p>
              </div>
            </div>
          </div>

          <footer hlmCardFooter class="flex-col gap-4 border-t px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <p class="text-sm text-muted-foreground">Base visual para el MVP de mantenimiento correctivo.</p>
            <a hlmBtn variant="outline" href="#proximas-funcionalidades">Conocer el sistema</a>
          </footer>
        </article>
      </section>
    </main>
  `,
})
export class HomePage {}
