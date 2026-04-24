import {Component, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {QueryDocumentSnapshot} from 'firebase/firestore';
import {IProdukt, IRabatt} from '../../models/interfaces/IProdukt';
import {IKategorie} from '../../models/interfaces/IKategorie';
import {ProduktService} from '../../services/produkt.service';
import {KategorieService} from '../../services/kategorie.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {AdminProductsStateService} from '../../services/admin-products-state.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {AdminNav} from '../../components/admin-nav/admin-nav';

type SortCol = 'bezeichnung' | 'preis' | 'lagerbestand' | 'verfuegbar' | 'imgCount';

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
  private kategorieService = inject(KategorieService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);
  private stateService = inject(AdminProductsStateService);

  protected kategorien = signal<IKategorie[]>([]);
  protected bulkAssigning = signal(false);
  protected showExportPanel = signal(false);
  protected showRabattPanel = signal(false);
  protected bulkRabattProzent = '';
  protected bulkRabattAb = '';
  protected bulkRabattBis = '';
  protected bulkRabattSaving = signal(false);
  protected exportKatFilter = signal<Set<string>>(new Set());
  protected readonly PAGE_SIZE = 20;
  protected currentPage = signal(1);
  protected totalCount = signal(0);
  protected pageItems = signal<IProdukt[]>([]);
  protected loading = signal(true);
  protected importing = signal(false);
  protected importResult = signal<{ success: number; failed: number } | null>(null);
  protected searchActive = signal(false);

  // ── Selection ─────────────────────────────────────────────────────────────
  protected selectedIds = signal<Set<string>>(new Set());

  // ── Sort ──────────────────────────────────────────────────────────────────
  protected sortCol = signal<SortCol | null>(null);
  protected sortDir = signal<'asc' | 'desc'>('asc');

  // ── Column filters ────────────────────────────────────────────────────────
  protected filterBezeichnung = '';
  protected filterPreisMin = '';
  protected filterPreisMax = '';
  protected filterLagerMin = '';
  protected filterLagerMax = '';
  protected filterVerfuegbar: 'all' | 'true' | 'false' = 'all';
  protected filterHasImage: 'all' | 'yes' | 'no' = 'all';

  private _searchText = '';
  private _allProdukte: IProdukt[] | null = null;
  private _filteredProdukte: IProdukt[] = [];
  private _cursors = new Map<number, QueryDocumentSnapshot>();

  // ── searchText ────────────────────────────────────────────────────────────
  get searchText() { return this._searchText; }
  set searchText(v: string) {
    this._searchText = v;
    this.onFilterOrSortChange();
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  get hasActiveFiltersOrSort(): boolean {
    return !!(
      this._searchText.trim() ||
      this.filterBezeichnung.trim() ||
      this.filterPreisMin || this.filterPreisMax ||
      this.filterLagerMin || this.filterLagerMax ||
      this.filterVerfuegbar !== 'all' ||
      this.filterHasImage !== 'all' ||
      this.sortCol() !== null
    );
  }

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

  get pageNumbers(): (number | -1)[] {
    const total = this.totalPages;
    const current = this.currentPage();
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | -1)[] = [1];
    if (current > 3) pages.push(-1);
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  // ── Selection ─────────────────────────────────────────────────────────────
  isSelected(id: string): boolean { return this.selectedIds().has(id); }

  toggleSelect(id: string) {
    const next = new Set(this.selectedIds());
    next.has(id) ? next.delete(id) : next.add(id);
    this.selectedIds.set(next);
  }

  get allCurrentPageSelected(): boolean {
    const sel = this.selectedIds();
    return this.pagedProdukte.length > 0 && this.pagedProdukte.every(p => sel.has(p.id));
  }

  get someCurrentPageSelected(): boolean {
    const sel = this.selectedIds();
    return this.pagedProdukte.some(p => sel.has(p.id)) && !this.allCurrentPageSelected;
  }

  toggleSelectAll() {
    const next = new Set(this.selectedIds());
    if (this.allCurrentPageSelected) {
      this.pagedProdukte.forEach(p => next.delete(p.id));
    } else {
      this.pagedProdukte.forEach(p => next.add(p.id));
    }
    this.selectedIds.set(next);
  }

  selectedCount(): number { return this.selectedIds().size; }
  clearSelection() { this.selectedIds.set(new Set()); }

  // ── Sort ──────────────────────────────────────────────────────────────────
  toggleSort(col: SortCol) {
    if (this.sortCol() === col) {
      if (this.sortDir() === 'asc') {
        this.sortDir.set('desc');
      } else {
        this.sortCol.set(null);
      }
    } else {
      this.sortCol.set(col);
      this.sortDir.set('asc');
    }
    this.onFilterOrSortChange();
  }

  sortIcon(col: SortCol): string {
    if (this.sortCol() !== col) return 'unfold_more';
    return this.sortDir() === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
  }

  // ── Filter/Sort change handler ────────────────────────────────────────────
  async onFilterOrSortChange() {
    if (this.hasActiveFiltersOrSort) {
      if (!this._allProdukte) {
        this.loading.set(true);
        try {
          this._allProdukte = await this.produktService.getProdukte();
        } finally {
          this.loading.set(false);
        }
      }
      this.searchActive.set(true);
      this.applyAllFilters();
    } else {
      this.searchActive.set(false);
      this._filteredProdukte = [];
      this.currentPage.set(1);
      await this.loadPage(1);
    }
  }

  private applyAllFilters() {
    if (!this._allProdukte) return;
    let result = [...this._allProdukte];

    if (this._searchText.trim()) {
      const q = this._searchText.toLowerCase();
      result = result.filter(p =>
        (p.bezeichnung ?? '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }
    if (this.filterBezeichnung.trim()) {
      const q = this.filterBezeichnung.toLowerCase();
      result = result.filter(p => (p.bezeichnung ?? '').toLowerCase().includes(q));
    }
    const preisMin = parseFloat(this.filterPreisMin); if (this.filterPreisMin !== '' && !isNaN(preisMin)) result = result.filter(p => p.preis >= preisMin);
    const preisMax = parseFloat(this.filterPreisMax); if (this.filterPreisMax !== '' && !isNaN(preisMax)) result = result.filter(p => p.preis <= preisMax);
    const lagerMin = parseInt(this.filterLagerMin);   if (this.filterLagerMin !== '' && !isNaN(lagerMin)) result = result.filter(p => p.lagerbestand >= lagerMin);
    const lagerMax = parseInt(this.filterLagerMax);   if (this.filterLagerMax !== '' && !isNaN(lagerMax)) result = result.filter(p => p.lagerbestand <= lagerMax);
    if (this.filterVerfuegbar !== 'all') {
      const v = this.filterVerfuegbar === 'true';
      result = result.filter(p => p.verfuegbar === v);
    }
    if (this.filterHasImage !== 'all') {
      const want = this.filterHasImage === 'yes';
      result = result.filter(p => want ? ((p.imgRefs?.length ?? 0) > 0) : !((p.imgRefs?.length ?? 0) > 0));
    }

    const col = this.sortCol();
    const dir = this.sortDir();
    if (col) {
      result.sort((a, b) => {
        let av: any, bv: any;
        if (col === 'imgCount') {
          av = a.imgRefs?.length ?? 0;
          bv = b.imgRefs?.length ?? 0;
        } else {
          av = (a as any)[col];
          bv = (b as any)[col];
          if (typeof av === 'string') { av = av.toLowerCase(); bv = (bv as string).toLowerCase(); }
        }
        if (av < bv) return dir === 'asc' ? -1 : 1;
        if (av > bv) return dir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    this._filteredProdukte = result;
    this.currentPage.set(1);
    this.clearSelection();
  }

  clearAllFilters() {
    this._searchText = '';
    this.filterBezeichnung = '';
    this.filterPreisMin = '';
    this.filterPreisMax = '';
    this.filterLagerMin = '';
    this.filterLagerMax = '';
    this.filterVerfuegbar = 'all';
    this.filterHasImage = 'all';
    this.sortCol.set(null);
    this.onFilterOrSortChange();
  }

  // ── Bulk delete ───────────────────────────────────────────────────────────
  bulkDelete() {
    const count = this.selectedCount();
    this.dialogService.openConfirm(
      'Mehrere Produkte löschen',
      `${count} Produkt(e) wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      async () => {
        const ids = [...this.selectedIds()];
        await Promise.all(ids.map(id => this.produktService.deleteProdukt(id)));
        this.totalCount.update(n => n - ids.length);
        if (this._allProdukte) this._allProdukte = this._allProdukte.filter(p => !ids.includes(p.id));
        if (this.searchActive()) {
          this.applyAllFilters();
        } else {
          this.pageItems.update(items => items.filter(p => !ids.includes(p.id)));
          for (const p of [...this._cursors.keys()]) {
            if (p >= this.currentPage()) this._cursors.delete(p);
          }
        }
        this.clearSelection();
      }
    );
  }

  // ── Bulk assign category ──────────────────────────────────────────────────
  async bulkAssignKategorie(event: Event) {
    const select = event.target as HTMLSelectElement;
    const value = select.value;
    select.value = '';
    if (!value) return;

    const ids = [...this.selectedIds()];
    const kategorieId = value === '__none__' ? undefined : value;
    this.bulkAssigning.set(true);
    try {
      await this.produktService.bulkSetKategorie(ids, kategorieId);
      const update = (p: IProdukt) =>
        ids.includes(p.id) ? {...p, kategorieId} : p;
      if (this._allProdukte) this._allProdukte = this._allProdukte.map(update);
      this.pageItems.update(items => items.map(update));
      if (this.searchActive()) this.applyAllFilters();
    } finally {
      this.bulkAssigning.set(false);
    }
  }

  // ── Bulk rabatt ───────────────────────────────────────────────────────────
  openRabattPanel() {
    this.bulkRabattProzent = '';
    this.bulkRabattAb = '';
    this.bulkRabattBis = '';
    this.showRabattPanel.set(true);
  }

  async applyBulkRabatt() {
    const pct = parseFloat(this.bulkRabattProzent);
    if (isNaN(pct) || pct <= 0 || pct >= 100) return;
    const ids = [...this.selectedIds()];
    const rabatt: IRabatt = {
      prozent: pct,
      ...(this.bulkRabattAb ? { gueltigAb: this.bulkRabattAb } : {}),
      ...(this.bulkRabattBis ? { gueltigBis: this.bulkRabattBis } : {}),
    };
    this.bulkRabattSaving.set(true);
    try {
      await this.produktService.bulkSetRabatt(ids, rabatt);
      const update = (p: IProdukt) => ids.includes(p.id) ? { ...p, rabatt } : p;
      if (this._allProdukte) this._allProdukte = this._allProdukte.map(update);
      this.pageItems.update(items => items.map(update));
      if (this.searchActive()) this.applyAllFilters();
      this.showRabattPanel.set(false);
    } finally {
      this.bulkRabattSaving.set(false);
    }
  }

  async removeBulkRabatt() {
    const ids = [...this.selectedIds()];
    this.bulkRabattSaving.set(true);
    try {
      await this.produktService.bulkSetRabatt(ids, null);
      const update = (p: IProdukt) => { const q = { ...p }; delete q.rabatt; return q; };
      if (this._allProdukte) this._allProdukte = this._allProdukte.map(update);
      this.pageItems.update(items => items.map(update));
      if (this.searchActive()) this.applyAllFilters();
      this.showRabattPanel.set(false);
    } finally {
      this.bulkRabattSaving.set(false);
    }
  }

  // ── Rabatt display helpers ────────────────────────────────────────────────
  isRabattAktiv(p: IProdukt): boolean {
    const r = p.rabatt;
    if (!r?.prozent) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (r.gueltigAb && today < r.gueltigAb) return false;
    if (r.gueltigBis && today < r.gueltigBis || !r.gueltigBis) return true;
    return false;
  }

  getRabattLabel(p: IProdukt): string {
    const r = p.rabatt;
    if (!r?.prozent) return '';
    const today = new Date().toISOString().slice(0, 10);
    if (r.gueltigAb && today < r.gueltigAb) return `−${Math.round(r.prozent)}% (geplant)`;
    if (r.gueltigBis && today > r.gueltigBis) return '';
    return `−${Math.round(r.prozent)}%`;
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  async ngOnInit() {
    const saved = this.stateService.state;
    if (saved) {
      this.stateService.state = null;
      this._searchText = saved.searchText;
      this.filterBezeichnung = saved.filterBezeichnung;
      this.filterPreisMin = saved.filterPreisMin;
      this.filterPreisMax = saved.filterPreisMax;
      this.filterLagerMin = saved.filterLagerMin;
      this.filterLagerMax = saved.filterLagerMax;
      this.filterVerfuegbar = saved.filterVerfuegbar;
      this.filterHasImage = saved.filterHasImage;
      this.sortCol.set(saved.sortCol as SortCol | null);
      this.sortDir.set(saved.sortDir);

      await this.initialLoad();

      if (this.hasActiveFiltersOrSort) {
        await this.onFilterOrSortChange();
        if (saved.page > 1) this.currentPage.set(saved.page);
      } else if (saved.page > 1) {
        await this.loadPage(saved.page);
      }

      setTimeout(() => window.scrollTo({ top: saved.scrollY, behavior: 'instant' as ScrollBehavior }), 200);
    } else {
      await this.initialLoad();
    }
  }

  private async initialLoad() {
    this.loading.set(true);
    try {
      const [count, { items, lastDoc }, kategorien] = await Promise.all([
        this.produktService.getProduktCount(),
        this.produktService.getProduktePage(this.PAGE_SIZE),
        this.kategorieService.getKategorien(),
      ]);
      this.kategorien.set(kategorien);
      this.totalCount.set(count);
      this.pageItems.set(items);
      if (lastDoc) this._cursors.set(1, lastDoc);
      this.currentPage.set(1);
    } finally {
      this.loading.set(false);
    }
  }

  // ── Pagination ────────────────────────────────────────────────────────────
  async goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage() || this.loading()) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.clearSelection();
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

  private async ensureCursor(upToPage: number): Promise<QueryDocumentSnapshot | undefined> {
    let cursor: QueryDocumentSnapshot | undefined;
    for (let p = 1; p <= upToPage; p++) {
      if (this._cursors.has(p)) {
        cursor = this._cursors.get(p);
      } else {
        const { lastDoc } = await this.produktService.getProduktePage(this.PAGE_SIZE, cursor);
        if (lastDoc) { this._cursors.set(p, lastDoc); cursor = lastDoc; }
      }
    }
    return cursor;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  addProdukt() {
    this.saveState();
    this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new');
  }

  editProdukt(id: string) {
    this.saveState();
    this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, id);
  }

  private saveState() {
    this.stateService.state = {
      page: this.currentPage(),
      searchText: this._searchText,
      filterBezeichnung: this.filterBezeichnung,
      filterPreisMin: this.filterPreisMin,
      filterPreisMax: this.filterPreisMax,
      filterLagerMin: this.filterLagerMin,
      filterLagerMax: this.filterLagerMax,
      filterVerfuegbar: this.filterVerfuegbar,
      filterHasImage: this.filterHasImage,
      sortCol: this.sortCol(),
      sortDir: this.sortDir(),
      scrollY: window.scrollY,
    };
  }

  deleteProdukt(id: string) {
    this.dialogService.openConfirm('Produkt löschen', 'Soll dieses Produkt wirklich gelöscht werden?', async () => {
      await this.produktService.deleteProdukt(id);
      this.totalCount.update(n => n - 1);
      if (this._allProdukte) this._allProdukte = this._allProdukte.filter(x => x.id !== id);
      const next = new Set(this.selectedIds()); next.delete(id); this.selectedIds.set(next);
      if (this.searchActive()) {
        this.applyAllFilters();
      } else {
        this.pageItems.update(items => items.filter(x => x.id !== id));
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
  exportProdukte() {
    const kats = this.kategorien();
    const allIds = new Set(['__none__', ...kats.map(k => k.id)]);
    this.exportKatFilter.set(allIds);
    if (kats.length === 0) {
      this.runExport();
    } else {
      this.showExportPanel.set(true);
    }
  }

  get exportAllChecked(): boolean {
    const f = this.exportKatFilter();
    return f.has('__none__') && this.kategorien().every(k => f.has(k.id));
  }

  get exportSomeChecked(): boolean {
    return this.exportKatFilter().size > 0 && !this.exportAllChecked;
  }

  isExportKatChecked(id: string): boolean {
    return this.exportKatFilter().has(id);
  }

  toggleExportAll() {
    if (this.exportAllChecked) {
      this.exportKatFilter.set(new Set());
    } else {
      this.exportKatFilter.set(new Set(['__none__', ...this.kategorien().map(k => k.id)]));
    }
  }

  toggleExportKat(id: string) {
    const next = new Set(this.exportKatFilter());
    next.has(id) ? next.delete(id) : next.add(id);
    this.exportKatFilter.set(next);
  }

  async runExport() {
    this.showExportPanel.set(false);
    const filter = this.exportKatFilter();
    const all = await this.produktService.getProdukte();
    const kats = this.kategorien();
    const isFullExport = filter.has('__none__') && kats.every(k => filter.has(k.id));
    const produkte = isFullExport ? all : all.filter(p => {
      const kid = p.kategorieId;
      return kid ? filter.has(kid) : filter.has('__none__');
    });
    const data = produkte.map(p => ({
      id: p.id, bezeichnung: p.bezeichnung, beschreibung: p.beschreibung,
      preis: p.preis, verfuegbar: p.verfuegbar, lagerbestand: p.lagerbestand,
      imgRefs: (p.imgRefs ?? []).map(img => ({ url: img.path })),
    }));
    const date = new Date().toISOString().slice(0, 10);
    let suffix = '';
    if (!isFullExport) {
      const parts: string[] = [];
      if (filter.has('__none__')) parts.push('ohne_kategorie');
      for (const k of this.kategorien()) {
        if (filter.has(k.id)) parts.push(k.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_äöüß]/g, ''));
      }
      suffix = '_' + parts.join('_');
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `produkte_export_${date}${suffix}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  // ── Import ────────────────────────────────────────────────────────────────
  openImportPicker() { this.importInput.nativeElement.click(); }

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
      `${parsed.length} Produkt(e) importieren? Produkte mit bekannter ID werden aktualisiert, neue angelegt.`,
      () => this.runImport(parsed)
    );
  }

  private async runImport(raw: any[]) {
    this.importing.set(true);
    this.importResult.set(null);
    let success = 0, failed = 0;
    for (const item of raw) {
      try {
        if (!item.bezeichnung || item.preis == null) { failed++; continue; }
        const produkt: IProdukt = {
          id: item.id ?? '', bezeichnung: String(item.bezeichnung),
          beschreibung: String(item.beschreibung ?? ''), preis: Number(item.preis),
          verfuegbar: item.verfuegbar ?? true, lagerbestand: Number(item.lagerbestand ?? 0),
          imgRefs: (item.imgRefs ?? []).map((img: any, i: number) => ({
            id: '', path: img.path ?? img.url ?? '', position: i,
          })),
        };
        if (item.id) await this.produktService.upsertProdukt(item.id, produkt);
        else await this.produktService.addProdukt(produkt);
        success++;
      } catch { failed++; }
    }
    this._allProdukte = null; this._cursors.clear();
    this._searchText = ''; this.searchActive.set(false); this._filteredProdukte = [];
    await this.initialLoad();
    this.importing.set(false);
    this.importResult.set({ success, failed });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }
}
