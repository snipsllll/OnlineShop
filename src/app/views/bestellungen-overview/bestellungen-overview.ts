import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';
import {AuthService} from '../../services/auth.service';

@Component({
  selector: 'app-bestellungen-overview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bestellungen-overview.html',
  styleUrl: './bestellungen-overview.css',
})
export class BestellungenOverview implements OnInit {
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);
  private authService = inject(AuthService);

  protected bestellungen = signal<IBestellung[]>([]);
  protected loading = signal(true);
  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  async ngOnInit() {
    const uid = this.authService.currentUid();
    if (!uid) return;
    this.loading.set(true);
    try {
      const all = await this.bestellungService.getBestellungenByUser(uid);
      this.bestellungen.set(all.sort((a, b) => this.toMs(b.bestelldatum) - this.toMs(a.bestelldatum)));
    } finally {
      this.loading.set(false);
    }
  }

  goToDetails(id: string) { this.routingService.route(MyRoutes.BESTELLUNG_DETAILS, id); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }

  canCancel(b: IBestellung): boolean {
    return b.bestellungsZustand === BestellungsZustand.EINGEGANGEN ||
           b.bestellungsZustand === BestellungsZustand.IN_BEARBEITUNG;
  }

  cancelBestellung(b: IBestellung, event: MouseEvent) {
    event.stopPropagation();
    this.dialogService.openConfirm(
      'Bestellung stornieren',
      'Möchtest du diese Bestellung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.',
      async () => {
        const updated: IBestellung = { ...b, bestellungsZustand: BestellungsZustand.STORNIERT };
        await this.bestellungService.editBestellung(b.id, updated);
        this.bestellungen.update(list => list.map(x => x.id === b.id ? updated : x));
      }
    );
  }

  getZustandLabel(z: BestellungsZustand): string {
    switch(z) {
      case BestellungsZustand.EINGEGANGEN:    return 'Eingegangen';
      case BestellungsZustand.IN_BEARBEITUNG: return 'In Bearbeitung';
      case BestellungsZustand.VERSANDT:       return 'Versandt';
      case BestellungsZustand.ANGEKOMMEN:     return 'Angekommen';
      case BestellungsZustand.STORNIERT:      return 'Storniert';
      default: return 'Unbekannt';
    }
  }

  getZustandClass(z: BestellungsZustand): string {
    switch(z) {
      case BestellungsZustand.ANGEKOMMEN:     return 'badge--success';
      case BestellungsZustand.VERSANDT:       return 'badge--neutral';
      case BestellungsZustand.IN_BEARBEITUNG: return 'badge--warning';
      case BestellungsZustand.STORNIERT:      return 'badge--error';
      default: return 'badge--neutral';
    }
  }

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  private toMs(d: any): number {
    if (!d) return 0;
    if (typeof d.toDate === 'function') return d.toDate().getTime();
    return new Date(d).getTime();
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }

  getOrderTotal(b: IBestellung): number {
    return (b.produkte ?? []).reduce((s, p) => s + p.preis * p.anzahl, 0);
  }
}
