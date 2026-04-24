import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';
import {AdminNav} from '../../components/admin-nav/admin-nav';
import {ProduktService} from '../../services/produkt.service';

@Component({
  selector: 'app-admin-bestellungen-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-bestellungen-overview.html',
  styleUrl: './admin-bestellungen-overview.css',
})
export class AdminBestellungenOverview implements OnInit {
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);
  private produktService = inject(ProduktService);

  protected bestellungen = signal<IBestellung[]>([]);
  protected loading = signal(true);
  protected updatingId = signal<string | null>(null);
  protected filterZustand: BestellungsZustand | 'all' = 'all';
  protected viewMode: 'aktuelle' | 'alle' = 'aktuelle';
  protected searchText = '';

  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  async ngOnInit() {
    await this.loadBestellungen();
  }

  async loadBestellungen() {
    this.loading.set(true);
    try {
      const all = await this.bestellungService.getBestellungen();
      this.bestellungen.set(all.sort((a, b) => this.toMs(b.bestelldatum) - this.toMs(a.bestelldatum)));
    } finally {
      this.loading.set(false);
    }
  }

  /** Base list after viewMode pre-filter */
  private get baseList(): IBestellung[] {
    if (this.viewMode === 'aktuelle') {
      return this.bestellungen().filter(b => {
        const z = Number(b.bestellungsZustand);
        return z !== BestellungsZustand.ANGEKOMMEN && z !== BestellungsZustand.STORNIERT;
      });
    }
    return this.bestellungen();
  }

  get filteredBestellungen(): IBestellung[] {
    let list = this.baseList;
    if (this.filterZustand !== 'all') {
      const f = this.filterZustand as number;
      list = list.filter(b => Number(b.bestellungsZustand) === f);
    }
    const q = this.searchText.trim().toLowerCase();
    if (q) list = list.filter(b => b.id.toLowerCase().includes(q));
    return list;
  }

  setViewMode(m: 'aktuelle' | 'alle') {
    this.viewMode = m;
    // Reset filter if it targets states hidden in aktuelle mode
    if (m === 'aktuelle' && this.filterZustand !== 'all') {
      const f = this.filterZustand as number;
      if (f === BestellungsZustand.ANGEKOMMEN || f === BestellungsZustand.STORNIERT) {
        this.filterZustand = 'all';
      }
    }
  }

  setFilter(z: BestellungsZustand | 'all') { this.filterZustand = z; }
  isActiveFilter(z: BestellungsZustand | 'all'): boolean { return this.filterZustand === z; }

  countByZustand(z: BestellungsZustand): number {
    return this.baseList.filter(b => Number(b.bestellungsZustand) === z).length;
  }

  get aktuelleCount(): number { return this.bestellungen().filter(b => {
    const z = Number(b.bestellungsZustand);
    return z !== BestellungsZustand.ANGEKOMMEN && z !== BestellungsZustand.STORNIERT;
  }).length; }

  // ── Status helpers ──────────────────────────────────────────

  zustand(b: IBestellung): BestellungsZustand { return Number(b.bestellungsZustand) as BestellungsZustand; }

  getZustandLabel(b: IBestellung): string {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:   return 'Eingegangen';
      case BestellungsZustand.IN_BEARBEITUNG: return 'In Bearbeitung';
      case BestellungsZustand.VERSANDT:      return 'Versandt';
      case BestellungsZustand.ANGEKOMMEN:    return 'Angekommen';
      case BestellungsZustand.STORNIERT:     return 'Storniert';
      default: return 'Unbekannt';
    }
  }

  getZustandClass(b: IBestellung): string {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:    return 'badge--primary';
      case BestellungsZustand.IN_BEARBEITUNG: return 'badge--warning';
      case BestellungsZustand.VERSANDT:       return 'badge--info';
      case BestellungsZustand.ANGEKOMMEN:     return 'badge--success';
      case BestellungsZustand.STORNIERT:      return 'badge--neutral';
      default: return 'badge--neutral';
    }
  }

  getAccentClass(b: IBestellung): string {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:    return 'accent--new';
      case BestellungsZustand.IN_BEARBEITUNG: return 'accent--processing';
      case BestellungsZustand.VERSANDT:       return 'accent--shipped';
      case BestellungsZustand.ANGEKOMMEN:     return 'accent--done';
      case BestellungsZustand.STORNIERT:      return 'accent--cancelled';
      default: return '';
    }
  }

  // ── Next-step logic ─────────────────────────────────────────

  getNextZustand(b: IBestellung): BestellungsZustand | null {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:    return BestellungsZustand.IN_BEARBEITUNG;
      case BestellungsZustand.IN_BEARBEITUNG: return BestellungsZustand.VERSANDT;
      case BestellungsZustand.VERSANDT:       return BestellungsZustand.ANGEKOMMEN;
      default: return null;
    }
  }

  getNextLabel(b: IBestellung): string {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:    return 'Annehmen';
      case BestellungsZustand.IN_BEARBEITUNG: return 'Versenden';
      case BestellungsZustand.VERSANDT:       return 'Angekommen';
      default: return '';
    }
  }

  getNextIcon(b: IBestellung): string {
    switch (this.zustand(b)) {
      case BestellungsZustand.EINGEGANGEN:    return 'play_arrow';
      case BestellungsZustand.IN_BEARBEITUNG: return 'local_shipping';
      case BestellungsZustand.VERSANDT:       return 'where_to_vote';
      default: return '';
    }
  }

  isNewOrder(b: IBestellung): boolean { return this.zustand(b) === BestellungsZustand.EINGEGANGEN; }
  isUnviewed(b: IBestellung): boolean { return b.isNew === true; }
  isCancelled(b: IBestellung): boolean { return this.zustand(b) === BestellungsZustand.STORNIERT; }
  isPaid(b: IBestellung): boolean { return Number(b.zahlungsZustand) === ZahlungsZustand.BEZAHLT; }
  isRefunded(b: IBestellung): boolean { return Number(b.zahlungsZustand) === ZahlungsZustand.ERSTATTET; }

  /** Annehmen + Versenden require payment. Angekommen (delivery confirm) does not. */
  canAdvance(b: IBestellung): boolean {
    if (this.getNextZustand(b) === null) return false;
    if (this.zustand(b) === BestellungsZustand.VERSANDT) return true; // delivery confirm always allowed
    return this.isPaid(b);
  }

  advanceBlockedReason(b: IBestellung): string {
    if (!this.isPaid(b) && this.zustand(b) !== BestellungsZustand.VERSANDT) return 'Zahlung noch ausstehend';
    return '';
  }

  async advanceZustand(b: IBestellung) {
    if (!this.canAdvance(b)) return;
    const next = this.getNextZustand(b);
    if (next === null) return;
    this.updatingId.set(b.id);
    try {
      const updated: IBestellung = {...b, bestellungsZustand: next};
      await this.bestellungService.editBestellung(b.id, updated);

      const positionen = b.produkte ?? [];
      if (this.zustand(b) === BestellungsZustand.EINGEGANGEN) {
        // Annehmen: Mengen reservieren
        await Promise.all(positionen.map(p => this.produktService.adjustStock(p.id, 0, p.anzahl)));
      } else if (this.zustand(b) === BestellungsZustand.IN_BEARBEITUNG) {
        // Versenden: Lager abbuchen + Reservierung aufheben
        await Promise.all(positionen.map(p => this.produktService.adjustStock(p.id, -p.anzahl, -p.anzahl)));
      }

      this.bestellungen.update(list => list.map(x => x.id === b.id ? updated : x));
    } finally {
      this.updatingId.set(null);
    }
  }

  // ── Format helpers ──────────────────────────────────────────

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', {day: '2-digit', month: '2-digit', year: 'numeric'});
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR'}).format(p ?? 0);
  }

  getOrderTotal(b: IBestellung): number {
    const produkte = (b.produkte ?? []).reduce((s, p) => s + (p.preis ?? 0) * (p.anzahl ?? 0), 0);
    return produkte + (b.versand?.kosten ?? 0);
  }

  onDetails(id: string) { this.routingService.route(MyRoutes.ADMIN_BESTELLUNG_DETAILS, id); }

  onDelete(b: IBestellung) {
    this.dialogService.openConfirm(
      'Bestellung löschen',
      'Soll diese Bestellung wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden.',
      async () => {
        await this.bestellungService.deleteBestellung(b.id);
        this.bestellungen.update(list => list.filter(x => x.id !== b.id));
      }
    );
  }

  private toMs(d: any): number {
    if (!d) return 0;
    if (typeof d.toDate === 'function') return d.toDate().getTime();
    return new Date(d).getTime();
  }
}
