import {Component, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {QueryDocumentSnapshot} from 'firebase/firestore';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-products-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-products-overview.html',
  styleUrl: './admin-products-overview.css',
})
export class AdminProductsOverview implements OnInit {
  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  private produktService = inject(ProduktService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);

  protected readonly PAGE_SIZE = 20;
  protected currentPage = signal(1);
  protected totalCount = signal(0);
  protected pageItems = signal<IProdukt[]>([]);
  protected loading = signal(true);
  protected importing = signal(false);
  protected importResult = signal<{ success: number; failed: number } | null>(null);
  protected searchActive = signal(false);

  private _searchText = '';
  private _allProdukte: IProdukt[] | null = null;
  private _filteredProdukte: IProdukt[] = [];
  // cursors.get(n) = last doc of page n; used as startAfter cursor to load page n+1
  private _cursors = new Map<number, QueryDocumentSnapshot>();

  // ── searchText getter/setter: resets page and triggers search ─────────────

  get searchText() { return this._searchText; }
  set searchText(v: string) {
    const wasEmpty = !this._searchText.trim();
    const isEmpty = !v.trim();
    this._searchText = v;
    if (!isEmpty) {
      if (wasEmpty) {
        this.loadAllForSearch();
      } else {
        this.applySearch();
      }
    } else {
      this.searchActive.set(false);
      this._filteredProdukte = [];
      this.currentPage.set(1);
      this.loadPage(1);
    }
  }

  // ── Computed ──────────────────────────────────────────────────────────────

  get displayedCount(): number {
    return this.searchActive() ? this._filteredProdukte.length : this.totalCount();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.displayedCount / this.PAGE_SIZE));
  }

  get pagedProdukte(): IProdukt[] {
    if (this.searchActive()) {
      const start = (this.currentPage() - 1) * this.PAGE_SIZE;
      return this._filteredProdukte.slice(start, start + this.PAGE_SIZE);
    }
    return this.pageItems();
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

  // ── Init ──────────────────────────────────────────────────────────────────

  async ngOnInit() {
    await this.initialLoad();
  }

  private async initialLoad() {
    this.loading.set(true);
    try {
      const [count, { items, lastDoc }] = await Promise.all([
        this.produktService.getProduktCount(),
        this.produktService.getProduktePage(this.PAGE_SIZE),
      ]);
      this.totalCount.set(count);
      this.pageItems.set(items);
      if (lastDoc) this._cursors.set(1, lastDoc);
      this.currentPage.set(1);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Firestore pagination ──────────────────────────────────────────────────

  async goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage() || this.loading()) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (this.searchActive()) {
      this.currentPage.set(page);
      return;
    }
    await this.loadPage(page);
  }

  private async loadPage(page: number) {
    this.loading.set(true);
    try {
      const cursor = page > 1 ? await this.ensureCursor(page - 1) : undefined;
      const { items, lastDoc } = await this.produktService.getProduktePage(this.PAGE_SIZE, cursor);
      this.pageItems.set(items);
      this.currentPage.set(page);
      if (lastDoc) this._cursors.set(page, lastDoc);
    } finally {
      this.loading.set(false);
    }
  }

  // Ensures cursors for pages 1..upToPage exist and returns the cursor for upToPage
  private async ensureCursor(upToPage: number): Promise<QueryDocumentSnapshot | undefined> {
    let cursor: QueryDocumentSnapshot | undefined;
    for (let p = 1; p <= upToPage; p++) {
      if (this._cursors.has(p)) {
        cursor = this._cursors.get(p);
      } else {
        const { lastDoc } = await this.produktService.getProduktePage(this.PAGE_SIZE, cursor);
        if (lastDoc) {
          this._cursors.set(p, lastDoc);
          cursor = lastDoc;
        }
      }
    }
    return cursor;
  }

  // ── Search ────────────────────────────────────────────────────────────────

  private async loadAllForSearch() {
    if (!this._allProdukte) {
      this.loading.set(true);
      try {
        this._allProdukte = await this.produktService.getProdukte();
      } finally {
        this.loading.set(false);
      }
    }
    this.searchActive.set(true);
    this.applySearch();
  }

  private applySearch() {
    if (!this._allProdukte) return;
    const q = this._searchText.toLowerCase().trim();
    this._filteredProdukte = this._allProdukte.filter(p =>
      (p.bezeichnung ?? '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
    this.currentPage.set(1);
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────

  addProdukt() { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new'); }
  editProdukt(id: string) { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, id); }

  deleteProdukt(id: string) {
    this.dialogService.openConfirm('Produkt löschen', 'Soll dieses Produkt wirklich gelöscht werden?', async () => {
      await this.produktService.deleteProdukt(id);
      this.totalCount.update(n => n - 1);
      if (this._allProdukte) this._allProdukte = this._allProdukte.filter(x => x.id !== id);
      if (this.searchActive()) {
        this.applySearch();
      } else {
        this.pageItems.update(items => items.filter(x => x.id !== id));
        // Invalidate cursors from current page onwards (page boundaries shifted)
        for (const p of [...this._cursors.keys()]) {
          if (p >= this.currentPage()) this._cursors.delete(p);
        }
        if (this.pageItems().length === 0 && this.currentPage() > 1) {
          await this.loadPage(this.currentPage() - 1);
        }
      }
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  async exportProdukte() {
    const all = await this.produktService.getProdukte();
    const data = all.map(p => ({
      id: p.id,
      bezeichnung: p.bezeichnung,
      beschreibung: p.beschreibung,
      preis: p.preis,
      verfuegbar: p.verfuegbar,
      lagerbestand: p.lagerbestand,
      imgRefs: (p.imgRefs ?? []).map(img => ({ url: img.path })),
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `produkte_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Import ────────────────────────────────────────────────────────────────

  openImportPicker() {
    this.importInput.nativeElement.click();
  }

  async onImportFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    (event.target as HTMLInputElement).value = '';
    if (!file) return;

    let parsed: any[];
    try {
      parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error();
    } catch {
      this.dialogService.openMessage('Ungültige Datei', 'Die Datei enthält kein gültiges JSON-Array.');
      return;
    }

    this.dialogService.openConfirm(
      'Produkte importieren',
      `${parsed.length} Produkt(e) importieren? Produkte mit bekannter ID werden aktualisiert, neue werden angelegt.`,
      () => this.runImport(parsed)
    );
  }

  private async runImport(raw: any[]) {
    this.importing.set(true);
    this.importResult.set(null);
    let success = 0;
    let failed = 0;

    for (const item of raw) {
      try {
        if (!item.bezeichnung || item.preis == null) { failed++; continue; }
        const produkt: IProdukt = {
          id: item.id ?? '',
          bezeichnung: String(item.bezeichnung),
          beschreibung: String(item.beschreibung ?? ''),
          preis: Number(item.preis),
          verfuegbar: item.verfuegbar ?? true,
          lagerbestand: Number(item.lagerbestand ?? 0),
          imgRefs: (item.imgRefs ?? []).map((img: any, i: number) => ({
            id: '',
            path: img.path ?? img.url ?? '',
            position: i,
          })),
        };
        if (item.id) {
          await this.produktService.upsertProdukt(item.id, produkt);
        } else {
          await this.produktService.addProdukt(produkt);
        }
        success++;
      } catch {
        failed++;
      }
    }

    // Reset caches and reload from scratch
    this._allProdukte = null;
    this._cursors.clear();
    this._searchText = '';
    this.searchActive.set(false);
    this._filteredProdukte = [];
    await this.initialLoad();
    this.importing.set(false);
    this.importResult.set({ success, failed });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }
}
