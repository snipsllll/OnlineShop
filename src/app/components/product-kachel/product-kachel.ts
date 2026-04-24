import {Component, Input, Output, EventEmitter, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProdukt} from '../../models/interfaces/IProdukt';

function berechneEffektivenPreis(p: IProdukt): number {
  const r = p.rabatt;
  if (!r?.prozent) return p.preis;
  const today = new Date().toISOString().slice(0, 10);
  if (r.gueltigAb && today < r.gueltigAb) return p.preis;
  if (r.gueltigBis && today > r.gueltigBis) return p.preis;
  return Math.round(p.preis * (1 - r.prozent / 100) * 100) / 100;
}
import {RoutingService} from '../../services/routing.service';
import {WarenkorbService} from '../../services/warenkorb.service';
import {FavoritService} from '../../services/favorit.service';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';
import {BreakpointService} from '../../services/breakpoint.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-product-kachel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-kachel.html',
  styleUrl: './product-kachel.css',
})
export class ProductKachel {
  @Input() produkt!: IProdukt;
  @Input() isFavorit = false;
  @Output() favoritToggled = new EventEmitter<string>();

  private routingService = inject(RoutingService);
  private warenkorbService = inject(WarenkorbService);
  private favoritService = inject(FavoritService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  protected bp = inject(BreakpointService);

  protected addingToCart = signal(false);
  protected addedToCart = signal(false);

  goToDetails() {
    this.routingService.route(MyRoutes.PRODUKT_DETAILS, this.produkt.id);
  }

  async addToCart(event: Event) {
    event.stopPropagation();
    this.addingToCart.set(true);
    try {
      await this.warenkorbService.addToWarenkorb(this.produkt.id, 1);
      this.addedToCart.set(true);
      setTimeout(() => { this.addedToCart.set(false); }, 1500);
    } finally {
      this.addingToCart.set(false);
    }
  }

  async toggleFavorit(event: Event) {
    event.stopPropagation();
    if (!this.authService.isLoggedIn()) {
      this.dialogService.openLogin();
      return;
    }
    if (this.isFavorit) {
      await this.favoritService.removeFromFavorit(this.produkt.id);
    } else {
      await this.favoritService.addToFavorit(this.produkt.id);
    }
    this.favoritToggled.emit(this.produkt.id);
  }

  get firstImagePath(): string | null {
    if (!this.produkt.imgRefs?.length) return null;
    return this.produkt.imgRefs.slice().sort((a, b) => a.position - b.position)[0]?.path ?? null;
  }

  private fmt(n: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(n);
  }

  get priceFormatted(): string { return this.fmt(this.produkt.preis); }

  get isRabattAktiv(): boolean {
    return berechneEffektivenPreis(this.produkt) < this.produkt.preis;
  }

  get effektivPreisFormatted(): string {
    return this.fmt(berechneEffektivenPreis(this.produkt));
  }

  get rabattBadge(): string {
    return `−${Math.round(this.produkt.rabatt!.prozent)}%`;
  }
}
