import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {FavoritService} from '../../services/favorit.service';
import {ProductKachel} from '../../components/product-kachel/product-kachel';

@Component({
  selector: 'app-products-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductKachel],
  templateUrl: './products-overview.html',
  styleUrl: './products-overview.css',
})
export class ProductsOverview implements OnInit {
  private produktService = inject(ProduktService);
  private favoritService = inject(FavoritService);

  protected produkte = signal<IProdukt[]>([]);
  protected favoritenIds = signal<string[]>([]);
  protected loading = signal(true);
  protected searchText = '';
  protected sortBy = 'name';
  protected showOnlyAvailable = false;

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [produkte, favIds] = await Promise.all([
        this.produktService.getProdukte(),
        this.favoritService.getFavoritenIds().catch(() => [] as string[])
      ]);
      this.produkte.set(produkte);
      this.favoritenIds.set(favIds);
    } finally {
      this.loading.set(false);
    }
  }

  get filteredProdukte(): IProdukt[] {
    let result = this.produkte();
    if (this.searchText.trim()) {
      const q = this.searchText.toLowerCase();
      result = result.filter(p =>
        (p.bezeichnung ?? '').toLowerCase().includes(q) ||
        (p.beschreibung ?? '').toLowerCase().includes(q)
      );
    }
    if (this.showOnlyAvailable) {
      result = result.filter(p => p.verfuegbar && p.lagerbestand > 0);
    }
    switch (this.sortBy) {
      case 'preis-asc': return [...result].sort((a, b) => a.preis - b.preis);
      case 'preis-desc': return [...result].sort((a, b) => b.preis - a.preis);
      default: return [...result].sort((a, b) => (a.bezeichnung ?? '').localeCompare(b.bezeichnung ?? ''));
    }
  }

  isFavorit(id: string): boolean {
    return this.favoritenIds().includes(id);
  }

  onFavoritToggled(id: string) {
    const ids = this.favoritenIds();
    if (ids.includes(id)) {
      this.favoritenIds.set(ids.filter(x => x !== id));
    } else {
      this.favoritenIds.set([...ids, id]);
    }
  }
}
