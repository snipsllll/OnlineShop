import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {WarenkorbService} from '../../services/warenkorb.service';
import {AuthService} from '../../services/auth.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar implements OnInit {
  private routingService = inject(RoutingService);
  protected dialogService = inject(DialogService);
  private warenkorbService = inject(WarenkorbService);
  protected authService = inject(AuthService);

  protected cartCount = signal(0);
  protected searchQuery = '';

  ngOnInit() {
    this.warenkorbService.getWahrenkorb().then(wk => {
      this.cartCount.set(wk?.produkteMitAnzahl?.length ?? 0);
    }).catch(() => {});
  }

  goHome() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
  goFavorites() { this.routingService.route(MyRoutes.FAVORITEN_LISTE); }
  goCart() { this.routingService.route(MyRoutes.WARENKORB); }
  goAccount() { this.routingService.route(MyRoutes.ACCOUNT_SETTINGS); }
  goOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
  openLogin() { this.dialogService.openLogin(); }
  async logout() {
    await this.authService.logout();
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
  }
}
