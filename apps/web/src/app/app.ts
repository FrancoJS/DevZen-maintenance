import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PreviewSessionService } from './core/preview-session.service';
import { NAVIGATION_GROUPS, UserRole } from './shared/navigation/navigation.model';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet, HlmAvatarImports, HlmSeparatorImports, HlmTooltipImports],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly session = inject(PreviewSessionService);
  private readonly router = inject(Router);
  protected sidebarCollapsed = false;
  protected mobileSidebarOpen = false;
  protected readonly role = this.session.role;
  protected readonly user = this.session.user;
  protected readonly navigationGroups = computed(() => NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => item.roles.includes(this.role())),
  })));

  protected changeRole(event: Event): void {
    const role = (event.target as HTMLSelectElement).value as UserRole;
    this.session.setRole(role);
    this.mobileSidebarOpen = false;
    const allowed = NAVIGATION_GROUPS.some((group) =>
      group.items.some((item) => item.route === this.router.url && item.roles.includes(role))
    );
    if (!allowed) void this.router.navigateByUrl('/inicio');
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }
}
