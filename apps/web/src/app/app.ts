import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

interface NavigationItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, HlmAvatarImports, HlmSeparatorImports, HlmTooltipImports],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected sidebarCollapsed = false;
  protected mobileSidebarOpen = false;

  protected readonly navigation: NavigationItem[] = [
    { label: 'Dashboard', route: '/inicio', icon: '⌂' },
    { label: 'Gestión de tickets', route: '/gestion-tickets', icon: '▤' },
    { label: 'Técnicos', route: '/tecnicos', icon: '♙' },
    { label: 'Congelamientos', route: '/congelamientos', icon: '❄' },
    { label: 'Historial', route: '/historial', icon: '◷' },
  ];

  protected toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }
}
