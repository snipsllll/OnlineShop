import {Component, inject, OnInit, signal} from '@angular/core';
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
export class FavoritenListe implements OnInit {
  private favoritService = inject(FavoritService);
  private routingService = inject(RoutingService);
  protected authService = inject(AuthService);
  private dialogService = inject(DialogService);

  protected favoriten = signal<IProdukt[]>([]);
  protected loading = signal(true);
  protected favoritenIds = signal<string[]>([]);

  async ngOnInit() {
    if (!this.authService.isLoggedIn()) {
      this.loading.set(false);
      return;
    }
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

  openLogin() { this.dialogService.openLogin(); }

  onFavoritToggled(id: string) {
    this.favoriten.update(f => f.filter(p => p.id !== id));
    this.favoritenIds.update(ids => ids.filter(x => x !== id));
  }

  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
