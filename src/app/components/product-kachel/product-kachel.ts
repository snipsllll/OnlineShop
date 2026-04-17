import {Component, Input, Output, EventEmitter, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {RoutingService} from '../../services/routing.service';
import {WarenkorbService} from '../../services/warenkorb.service';
import {FavoritService} from '../../services/favorit.service';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';
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

  protected addingToCart = false;

  goToDetails() {
    this.routingService.route(MyRoutes.PRODUKT_DETAILS, this.produkt.id);
  }

  async addToCart(event: Event) {
    event.stopPropagation();
    this.addingToCart = true;
    try {
      await this.warenkorbService.addToWarenkorb(this.produkt.id, 1);
    } finally {
      this.addingToCart = false;
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

  get priceFormatted(): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(this.produkt.preis);
  }
}
