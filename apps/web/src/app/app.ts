import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { PreviewSessionService } from './core/preview-session.service';
import { ThemeService } from './core/theme.service';
import { NAVIGATION_GROUPS, UserRole } from './shared/navigation/navigation.model';
import { HlmAvatarImports } from '@spartan-ng/helm/avatar';
import { HlmSeparatorImports } from '@spartan-ng/helm/separator';
import { HlmTooltipImports } from '@spartan-ng/helm/tooltip';
import { HlmToasterImports } from '@spartan-ng/helm/sonner';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    HlmAvatarImports,
    HlmSeparatorImports,
    HlmTooltipImports,
    HlmToasterImports,
  ],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
