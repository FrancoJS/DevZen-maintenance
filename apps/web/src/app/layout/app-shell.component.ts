import {
  Component,
  DestroyRef,
  HostListener,
  computed,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
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
  NavigationEnd,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmBadgeImports } from '@spartan-ng/helm/badge';
import { CurrentMaintenanceStatusService } from '../core/current-maintenance-status.service';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { PreviewSessionService } from '../core/preview-session.service';
import { ThemeService } from '../core/theme.service';
import { AppFooterComponent } from '../shared/components/app-footer/app-footer.component';
import { NAVIGATION_GROUPS } from '../shared/navigation/navigation.model';

@Component({
  selector: 'app-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    NgIcon,
    HlmAvatarImports,
    HlmBadgeImports,
    HlmSeparatorImports,
    HlmTooltipImports,
    AppFooterComponent,
  ],
  providers: [
    CurrentMaintenanceStatusService,
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
  private readonly destroyRef = inject(DestroyRef);
  protected readonly maintenanceStatus = inject(
    CurrentMaintenanceStatusService,
  );
  protected readonly availabilityLabel = computed(() => {
    const availability = this.maintenanceStatus.availability();
    if (availability === 'BUSY') return 'Ocupado';
    if (availability === 'AVAILABLE') return 'Disponible';
    return this.maintenanceStatus.isLoading() ? 'Consultando' : 'Sin confirmar';
  });
  protected sidebarCollapsed = false;
  protected mobileSidebarOpen = false;
  protected readonly role = this.session.role;
  protected readonly user = this.session.user;
  protected readonly navigationItems = computed(() =>
    NAVIGATION_GROUPS.flatMap((group) => group.items).filter((item) =>
      item.roles.includes(this.role()),
    ),
  );

  constructor() {
    this.refreshAvailability();
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.refreshAvailability());
  }

  @HostListener('window:focus')
  protected refreshAvailability(): void {
    if (this.role() !== 'TECHNICIAN') return;
    this.maintenanceStatus
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => {
          /* The read-only badge displays the unconfirmed state. */
        },
      });
  }

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
