import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-nav.html',
  styleUrl: './admin-nav.css',
})
export class AdminNav {
  private router = inject(Router);
  private routingService = inject(RoutingService);

  isActive(section: 'dashboard' | 'products' | 'orders'): boolean {
    const url = this.router.url;
    switch (section) {
      case 'dashboard': return url.includes('admin-dashboard');
      case 'products':  return url.includes('admin-products') || url.includes('admin-product-details');
      case 'orders':    return url.includes('admin-bestellungen') || url.includes('admin-bestellung-details');
    }
  }

  goDashboard()  { this.routingService.route(MyRoutes.ADMIN_DASHBOARD); }
  goProducts()   { this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW); }
  goOrders()     { this.routingService.route(MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW); }
  goToShop()     { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
