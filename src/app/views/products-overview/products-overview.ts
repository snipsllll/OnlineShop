import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {IKategorie} from '../../models/interfaces/IKategorie';
import {ProduktService} from '../../services/produkt.service';
import {KategorieService} from '../../services/kategorie.service';
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
  private kategorieService = inject(KategorieService);
  private favoritService = inject(FavoritService);

  protected produkte = signal<IProdukt[]>([]);
  protected kategorien = signal<IKategorie[]>([]);
  protected favoritenIds = signal<string[]>([]);
  protected loading = signal(true);
  protected searchText = '';
  protected sortBy = 'name';
  protected showOnlyAvailable = false;
  protected selectedKategorieId: string | null = null;

  protected readonly PAGE_SIZE = 24;
  protected currentPage = signal(1);

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [produkte, kategorien, favIds] = await Promise.all([
        this.produktService.getProdukte(),
        this.kategorieService.getKategorien(),
        this.favoritService.getFavoritenIds().catch(() => [] as string[])
      ]);
      this.produkte.set(produkte);
      this.kategorien.set(kategorien);
      this.favoritenIds.set(favIds);
    } finally {
      this.loading.set(false);
    }
  }

  selectKategorie(id: string | null) {
    this.selectedKategorieId = id;
    this.resetPage();
  }

  get filteredProdukte(): IProdukt[] {
    let result = this.produkte();
    if (this.selectedKategorieId) {
      result = result.filter(p => p.kategorieId === this.selectedKategorieId);
    }
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

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProdukte.length / this.PAGE_SIZE));
  }

  get pagedProdukte(): IProdukt[] {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filteredProdukte.slice(start, start + this.PAGE_SIZE);
  }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage()) return;
    this.currentPage.set(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetPage() {
    this.currentPage.set(1);
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
