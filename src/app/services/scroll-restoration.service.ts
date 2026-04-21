import { inject, Injectable } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ScrollRestorationService {
  private router = inject(Router);
  private positions = new Map<string, number>();
  private isPopstate = false;

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.positions.set(this.router.url, window.scrollY);
        this.isPopstate = event.navigationTrigger === 'popstate';
      }
      if (event instanceof NavigationEnd) {
        if (!this.isPopstate) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          const targetY = this.positions.get(event.urlAfterRedirects) ?? 0;
          this.restoreWithRetry(targetY);
        }
      }
    });
  }

  // Retries until the page is tall enough to scroll to targetY (async data may still be loading)
  private restoreWithRetry(targetY: number, attempts = 10): void {
    if (attempts <= 0) {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      return;
    }
    requestAnimationFrame(() => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= targetY) {
        window.scrollTo({ top: targetY, behavior: 'instant' });
      } else {
        setTimeout(() => this.restoreWithRetry(targetY, attempts - 1), 50);
      }
    });
  }
}
