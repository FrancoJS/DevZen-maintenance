import { Component, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideClipboardList,
  lucideHistory,
  lucideLayoutDashboard,
  lucideLogOut,
  lucideSnowflake,
  lucideTickets,
} from '@ng-icons/lucide';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { PreviewSessionService } from '../core/preview-session.service';
import { ThemeService } from '../core/theme.service';
import { NAVIGATION_GROUPS } from '../shared/navigation/navigation.model';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIcon,
    HlmAvatarImports,
    HlmSeparatorImports,
    HlmTooltipImports,
  ],
  providers: [
    provideIcons({
      lucideClipboardList,
      lucideHistory,
      lucideLayoutDashboard,
      lucideLogOut,
      lucideSnowflake,
      lucideTickets,
    }),
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
})
export class AppShellComponent {
  private readonly session = inject(PreviewSessionService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  protected sidebarCollapsed = false;
  protected mobileSidebarOpen = false;
  protected readonly role = this.session.role;
  protected readonly user = this.session.user;
  protected readonly navigationItems = computed(() =>
    NAVIGATION_GROUPS.flatMap((group) => group.items).filter((item) =>
      item.roles.includes(this.role()),
    ),
  );

  protected toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  protected closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  protected logout(): void {
    this.session.logout();
    void this.router.navigateByUrl('/login');
  }
}
