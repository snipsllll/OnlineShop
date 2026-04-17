import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-owner-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './owner-nav.html',
  styleUrl: './owner-nav.css',
})
export class OwnerNav {
  private router = inject(Router);
  private routingService = inject(RoutingService);

  protected menuOpen = signal(false);

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu()  { this.menuOpen.set(false); }

  isActive(section: 'shops'): boolean {
    return this.router.url.includes('owner-shops');
  }

  goShops()   { this.routingService.route(MyRoutes.OWNER_SHOPS); this.closeMenu(); }
  goAdmin()   { this.routingService.route(MyRoutes.ADMIN_DASHBOARD); this.closeMenu(); }
}
