import {Component, ElementRef, HostListener, inject, OnInit, signal} from '@angular/core';
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
  private elementRef = inject(ElementRef);

  protected cartCount = signal(0);
  protected menuOpen = signal(false);

  ngOnInit() {
    this.warenkorbService.getWahrenkorb().then(wk => {
      this.cartCount.set(wk?.produkteMitAnzahl?.length ?? 0);
    }).catch(() => {});
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (this.menuOpen() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }

  toggleMenu() { this.menuOpen.update(v => !v); }
  closeMenu() { this.menuOpen.set(false); }

  goHome() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); this.closeMenu(); }
  goFavorites() { this.routingService.route(MyRoutes.FAVORITEN_LISTE); this.closeMenu(); }
  goCart() { this.routingService.route(MyRoutes.WARENKORB); this.closeMenu(); }
  goAccount() { this.routingService.route(MyRoutes.ACCOUNT_SETTINGS); this.closeMenu(); }
  goOrders() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }
  openLogin() { this.dialogService.openLogin(); this.closeMenu(); }
  async logout() {
    await this.authService.logout();
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
    this.closeMenu();
  }
}
