import {Component, ElementRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-admin-products-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products-overview.html',
  styleUrl: './admin-products-overview.css',
})
export class AdminProductsOverview implements OnInit {
  @ViewChild('importInput') importInput!: ElementRef<HTMLInputElement>;

  private produktService = inject(ProduktService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);

  protected produkte = signal<IProdukt[]>([]);
  protected loading = signal(true);
  protected importing = signal(false);
  protected importResult = signal<{ success: number; failed: number } | null>(null);
  protected searchText = '';

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.produkte.set(await this.produktService.getProdukte());
    } finally {
      this.loading.set(false);
    }
  }

  get filteredProdukte(): IProdukt[] {
    if (!this.searchText.trim()) return this.produkte();
    const q = this.searchText.toLowerCase();
    return this.produkte().filter(p =>
      (p.bezeichnung ?? '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  }

  addProdukt() { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new'); }
  editProdukt(id: string) { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, id); }

  deleteProdukt(id: string) {
    this.dialogService.openConfirm('Produkt löschen', 'Soll dieses Produkt wirklich gelöscht werden?', async () => {
      await this.produktService.deleteProdukt(id);
      this.produkte.update(p => p.filter(x => x.id !== id));
    });
  }

  // ── Export ────────────────────────────────────────────────────────────────

  exportProdukte() {
    const data = this.produkte().map(p => ({
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
      `${parsed.length} Produkt(e) aus der Datei importieren? Bestehende Produkte werden nicht verändert.`,
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
          id: '',
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
        await this.produktService.addProdukt(produkt);
        success++;
      } catch {
        failed++;
      }
    }

    // Produkte neu laden
    this.produkte.set(await this.produktService.getProdukte());
    this.importing.set(false);
    this.importResult.set({ success, failed });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }
}
