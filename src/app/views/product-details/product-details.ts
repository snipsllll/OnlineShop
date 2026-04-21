import {Component, effect, inject, OnInit, signal} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {WarenkorbService} from '../../services/warenkorb.service';
import {FavoritService} from '../../services/favorit.service';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {RouteParams} from '../../models/enums/RouteParams';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private produktService = inject(ProduktService);
  private warenkorbService = inject(WarenkorbService);
  private favoritService = inject(FavoritService);
  private authService = inject(AuthService);
  private dialogService = inject(DialogService);
  private routingService = inject(RoutingService);
  private location = inject(Location);

  protected produkt = signal<IProdukt | null>(null);
  protected loading = signal(true);
  protected isFavorit = signal(false);
  protected anzahl = 1;
  protected addingToCart = signal(false);
  protected addedToCart = signal(false);
  protected selectedImageIndex = 0;

  constructor() {
    // Reacts to both login state changes and product loading completing
    effect(() => {
      const loggedIn = this.authService.isLoggedIn();
      const p = this.produkt(); // track product signal too
      if (!loggedIn || !p) {
        this.isFavorit.set(false);
        return;
      }
      this.favoritService.getFavoritenIds()
        .then(ids => this.isFavorit.set(ids.includes(p.id)))
        .catch(() => this.isFavorit.set(false));
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get(RouteParams.PRODUCT_ID);
    if (!id) return;
    this.loading.set(true);
    try {
      const produkt = await this.produktService.getProdukt(id);
      this.produkt.set(produkt ?? null);
    } finally {
      this.loading.set(false);
    }
  }

  async addToCart() {
    const p = this.produkt();
    if (!p) return;
    this.addingToCart.set(true);
    try {
      await this.warenkorbService.addToWarenkorb(p.id, this.anzahl);
      this.addedToCart.set(true);
      setTimeout(() => { this.addedToCart.set(false); }, 2000);
    } finally {
      this.addingToCart.set(false);
    }
  }

  async toggleFavorit() {
    const p = this.produkt();
    if (!p) return;
    if (!this.authService.isLoggedIn()) {
      this.dialogService.openLogin();
      return;
    }
    if (this.isFavorit()) {
      await this.favoritService.removeFromFavorit(p.id);
      this.isFavorit.set(false);
    } else {
      await this.favoritService.addToFavorit(p.id);
      this.isFavorit.set(true);
    }
  }

  incrementAnzahl() {
    const p = this.produkt();
    if (p && this.anzahl < p.lagerbestand) this.anzahl++;
  }

  decrementAnzahl() {
    if (this.anzahl > 1) this.anzahl--;
  }

  selectImage(index: number) {
    this.selectedImageIndex = index;
  }

  goBack() { this.location.back(); }
  goToCart() { this.routingService.route(MyRoutes.WARENKORB); }

  get sortedImages() {
    return this.produkt()?.imgRefs?.slice().sort((a, b) => a.position - b.position) ?? [];
  }

  get priceFormatted(): string {
    const p = this.produkt();
    if (!p) return '';
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p.preis);
  }
}
