import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  template: `
    <footer
      class="border-t border-border bg-card px-4 py-5 text-center text-sm text-muted-foreground sm:px-6"
    >
      <p>DevZen Ops · Sistema de tickets de mantenimiento</p>
      <p class="mt-1 text-xs">Hackaton LuxNova INACAP 2026</p>
    </footer>
  `,
})
export class AppFooterComponent {}
