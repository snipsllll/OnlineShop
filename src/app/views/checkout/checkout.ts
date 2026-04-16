import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {IAdresse} from '../../models/interfaces/IAdresse';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {IBestellPosition} from '../../models/interfaces/IBestellPosition';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';
import {WarenkorbService} from '../../services/warenkorb.service';
import {ProduktService} from '../../services/produkt.service';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private warenkorbService = inject(WarenkorbService);
  private produktService = inject(ProduktService);
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);

  protected loading = signal(true);
  protected submitting = signal(false);
  protected cartProdukte = signal<Array<{produkt: IProdukt, anzahl: number}>>([]);

  protected adresse: Partial<IAdresse> = { strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland' };

  async ngOnInit() {
    this.loading.set(true);
    try {
      const wk = await this.warenkorbService.getWahrenkorb();
      const alleProdukte = await this.produktService.getProdukte();
      const items = wk.produkteMitAnzahl.map(p => {
        const produkt = alleProdukte.find(ap => ap.id === p.produktId);
        return produkt ? { produkt, anzahl: p.anzahl } : null;
      }).filter((x): x is {produkt: IProdukt, anzahl: number} => x !== null);
      this.cartProdukte.set(items);
    } finally {
      this.loading.set(false);
    }
  }

  get gesamtpreis(): number {
    return this.cartProdukte().reduce((s, i) => s + i.produkt.preis * i.anzahl, 0);
  }

  get gesamtpreisFormatted(): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(this.gesamtpreis);
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }

  async submitOrder() {
    this.submitting.set(true);
    try {
      const positionen: IBestellPosition[] = this.cartProdukte().map(i => ({
        id: i.produkt.id,
        bezeichnung: i.produkt.bezeichnung,
        preis: i.produkt.preis,
        anzahl: i.anzahl
      }));
      const bestellung: IBestellung = {
        id: '',
        produkte: positionen,
        bestelldatum: new Date(),
        lieferadresse: this.adresse as IAdresse,
        bestellungsZustand: BestellungsZustand.EINGEGANGEN,
        zahlungsZustand: ZahlungsZustand.NOCH_AUSSTEHEND
      };
      await this.bestellungService.addBestellung(bestellung);
      await this.warenkorbService.clearWarenkorb();
      this.routingService.route(MyRoutes.PAYMENT_APPROVAL);
    } finally {
      this.submitting.set(false);
    }
  }

  get isFormValid(): boolean {
    const a = this.adresse;
    return !!(a.strasse && a.hausnummer && a.plz && a.ort && a.land);
  }
}
