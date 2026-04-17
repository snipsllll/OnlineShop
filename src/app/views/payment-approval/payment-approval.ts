import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RoutingService} from '../../services/routing.service';
import {ShopSettingsService} from '../../services/shop-settings.service';
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
  protected settings = inject(ShopSettingsService);
  goToOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
