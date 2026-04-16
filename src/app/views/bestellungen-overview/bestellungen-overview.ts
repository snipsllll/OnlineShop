import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';

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

  protected bestellungen = signal<IBestellung[]>([]);
  protected loading = signal(true);
  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  async ngOnInit() {
    this.loading.set(true);
    try {
      const all = await this.bestellungService.getBestellungen();
      this.bestellungen.set(all.sort((a,b) => new Date(b.bestelldatum).getTime() - new Date(a.bestelldatum).getTime()));
    } finally {
      this.loading.set(false);
    }
  }

  goToDetails(id: string) { this.routingService.route(MyRoutes.BESTELLUNG_DETAILS, id); }
  goShopping() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }

  getZustandLabel(z: BestellungsZustand): string {
    switch(z) {
      case BestellungsZustand.EINGEGANGEN: return 'Eingegangen';
      case BestellungsZustand.IN_BEARBEITUNG: return 'In Bearbeitung';
      case BestellungsZustand.VERSANDT: return 'Versandt';
      case BestellungsZustand.ANGEKOMMEN: return 'Angekommen';
      default: return 'Unbekannt';
    }
  }

  getZustandClass(z: BestellungsZustand): string {
    switch(z) {
      case BestellungsZustand.ANGEKOMMEN: return 'badge--success';
      case BestellungsZustand.VERSANDT: return 'badge--neutral';
      case BestellungsZustand.IN_BEARBEITUNG: return 'badge--warning';
      default: return 'badge--neutral';
    }
  }

  formatDate(d: Date): string {
    return new Date(d).toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }

  getOrderTotal(b: IBestellung): number {
    return b.produkte.reduce((s, p) => s + p.preis * p.anzahl, 0);
  }
}
