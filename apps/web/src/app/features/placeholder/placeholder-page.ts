import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { HlmCardImports } from '@spartan-ng/helm/card';

@Component({
  selector: 'app-placeholder-page',
  imports: [HlmBadgeImports, HlmCardImports],
  template: `
    <div class="mx-auto max-w-6xl">
      <div class="mb-6"><p class="text-sm text-muted-foreground">Panel de control / {{ title }}</p><h2 class="mt-1 text-2xl font-bold tracking-tight">{{ title }}</h2></div>
      <article hlmCard class="border-border">
        <header hlmCardHeader><span hlmBadge variant="secondary" class="w-fit">Vista provisional</span><h3 hlmCardTitle class="mt-3">{{ title }}</h3><p hlmCardDescription>Esta sección está preparada para la siguiente etapa del frontend.</p></header>
        <div hlmCardContent><div class="rounded-lg border border-dashed bg-muted/30 p-8 text-center"><p class="font-medium">Contenido en construcción</p><p class="mt-1 text-sm text-muted-foreground">La navegación y el layout ya están disponibles para validar el flujo.</p></div></div>
      </article>
    </div>
  `,
})
export class PlaceholderPage {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = this.route.snapshot.data['title'] as string;
}
