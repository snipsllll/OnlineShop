import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {IWarenkorb} from '../../models/interfaces/IWarenkorb';
import {WarenkorbService} from '../../services/warenkorb.service';
import {ProduktService} from '../../services/produkt.service';
import {AuthService} from '../../services/auth.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

interface CartItem {
  produkt: IProdukt;
  anzahl: number;
}

@Component({
  selector: 'app-warenkorb',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './warenkorb.html',
  styleUrl: './warenkorb.css',
})
export class Warenkorb {
  private warenkorbService = inject(WarenkorbService);
  private produktService = inject(ProduktService);
  private authService = inject(AuthService);
  private routingService = inject(RoutingService);

  protected cartItems = signal<CartItem[]>([]);
  protected loading = signal(true);

  constructor() {
    effect(() => {
      this.authService.isLoggedIn(); // track login state changes
      this.loadCart();
    });
  }

  private async loadCart() {
    this.loading.set(true);
    try {
      const wk = await this.warenkorbService.getWahrenkorb();
      const alleProdukte = await this.produktService.getProdukte();
      const items: CartItem[] = wk.produkteMitAnzahl
        .map(p => {
          const produkt = alleProdukte.find(ap => ap.id === p.produktId);
          return produkt ? { produkt, anzahl: p.anzahl } : null;
        })
        .filter((x): x is CartItem => x !== null);
      this.cartItems.set(items);
    } finally {
      this.loading.set(false);
    }
  }

  async updateAnzahl(produktId: string, anzahl: number) {
    if (anzahl < 1) return;
    await this.warenkorbService.changeProduktAnzahl(produktId, anzahl);
    this.cartItems.update(items => items.map(i => i.produkt.id === produktId ? {...i, anzahl} : i));
  }

  async removeItem(produktId: string) {
    await this.warenkorbService.removeFromWarenkorb(produktId);
    this.cartItems.update(items => items.filter(i => i.produkt.id !== produktId));
  }

  get gesamtpreis(): number {
    return this.cartItems().reduce((sum, i) => sum + i.produkt.preis * i.anzahl, 0);
  }

  get gesamtpreisFormatted(): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(this.gesamtpreis);
  }

  formatPrice(preis: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(preis);
  }

  goToCheckout() { this.routingService.route(MyRoutes.CHECKOUT); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
