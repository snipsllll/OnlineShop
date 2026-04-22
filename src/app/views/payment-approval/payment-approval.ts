import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {RoutingService} from '../../services/routing.service';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {AuthService} from '../../services/auth.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-payment-approval',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-approval.html',
  styleUrl: './payment-approval.css',
})
export class PaymentApproval {
  private routingService = inject(RoutingService);
  private route = inject(ActivatedRoute);
  protected settings = inject(ShopSettingsService);
  protected authService = inject(AuthService);

  protected paymentMethod = signal<string>('paypal');

  constructor() {
    const m = this.route.snapshot.paramMap.get('method');
    if (m) this.paymentMethod.set(m);
  }

  get paymentMethodLabel(): string {
    switch ((this.paymentMethod() ?? '').toLowerCase()) {
      case 'paypal':
        return 'PayPal';
      case 'card':
        return 'Kreditkarte';
      case 'paylater':
        return 'Später bezahlen';
      default:
        return this.paymentMethod();
    }
  }

  goToOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
