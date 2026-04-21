import {Component, ElementRef, HostListener, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {WarenkorbService} from '../../services/warenkorb.service';
import {AuthService} from '../../services/auth.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {Rolle} from '../../models/enums/Rolle';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private routingService = inject(RoutingService);
  protected dialogService = inject(DialogService);
  protected warenkorbService = inject(WarenkorbService);
  protected authService = inject(AuthService);
  protected shopSettings = inject(ShopSettingsService);
  private elementRef = inject(ElementRef);

  protected cartCount = this.warenkorbService.cartCount;
  protected menuOpen = signal(false);

  constructor() {
    effect(() => {
      this.authService.isLoggedIn(); // track login/logout → refresh cart count
      this.warenkorbService.refreshCount();
    });
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }

  get isAdmin(): boolean {
    const r = this.authService.currentRolle();
    return r === Rolle.ADMIN || r === Rolle.OWNER || r === Rolle.MITARBEITER;
  }

  goHome() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); this.closeMenu(); }
  goFavorites() { this.routingService.route(MyRoutes.FAVORITEN_LISTE); this.closeMenu(); }
  goCart() { this.routingService.route(MyRoutes.WARENKORB); this.closeMenu(); }
  goAccount() { this.routingService.route(MyRoutes.ACCOUNT_SETTINGS); this.closeMenu(); }
  goOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
  goAdminPanel() { this.routingService.route(MyRoutes.ADMIN_DASHBOARD); this.closeMenu(); }
  openLogin() { this.dialogService.openLogin(); this.closeMenu(); }
  async logout() {
    await this.authService.logout();
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
    this.closeMenu();
  }
}
