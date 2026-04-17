import {Component, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {FavoritService} from '../../services/favorit.service';
import {RoutingService} from '../../services/routing.service';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {ProductKachel} from '../../components/product-kachel/product-kachel';

@Component({
  selector: 'app-favoriten-liste',
  standalone: true,
  imports: [CommonModule, ProductKachel],
  templateUrl: './favoriten-liste.html',
  styleUrl: './favoriten-liste.css',
})
export class FavoritenListe {
  private favoritService = inject(FavoritService);
  private routingService = inject(RoutingService);
  protected authService = inject(AuthService);
  private dialogService = inject(DialogService);

  protected favoriten = signal<IProdukt[]>([]);
  protected loading = signal(false);
  protected favoritenIds = signal<string[]>([]);

  constructor() {
    effect(() => {
      const loggedIn = this.authService.isLoggedIn(); // track
      if (!loggedIn) {
        this.favoriten.set([]);
        this.favoritenIds.set([]);
        this.loading.set(false);
        return;
      }
      this.loadFavoriten();
    });
  }

  private async loadFavoriten() {
    this.loading.set(true);
    try {
      const [produkte, ids] = await Promise.all([
        this.favoritService.getFavoritProdukte(),
        this.favoritService.getFavoritenIds().catch(() => [] as string[])
      ]);
      this.favoriten.set(produkte);
      this.favoritenIds.set(ids);
    } finally {
      this.loading.set(false);
    }
  }

  onFavoritToggled(id: string) {
    this.favoriten.update(f => f.filter(p => p.id !== id));
    this.favoritenIds.update(ids => ids.filter(x => x !== id));
  }

  openLogin() { this.dialogService.openLogin(); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
