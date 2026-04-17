import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {RouteParams} from '../../models/enums/RouteParams';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';

@Component({
  selector: 'app-bestellung-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bestellung-details.html',
  styleUrl: './bestellung-details.css',
})
export class BestellungDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  protected dialogService = inject(DialogService);

  protected bestellung = signal<IBestellung | null>(null);
  protected loading = signal(true);
  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get(RouteParams.BESTELLUNGS_ID);
    if (!id) return;
    this.loading.set(true);
    try {
      const b = await this.bestellungService.getBestellung(id);
      this.bestellung.set(b ?? null);
    } finally {
      this.loading.set(false);
    }
  }

  goBack() { this.routingService.route(MyRoutes.BESTELLUNGEN_OVERVIEW); }

  canCancel(): boolean {
    const z = this.bestellung()?.bestellungsZustand;
    return z === BestellungsZustand.EINGEGANGEN || z === BestellungsZustand.IN_BEARBEITUNG;
  }

  cancelBestellung() {
    const b = this.bestellung();
    if (!b || !this.canCancel()) return;
    this.dialogService.openConfirm(
      'Bestellung stornieren',
      'Möchtest du diese Bestellung wirklich stornieren? Diese Aktion kann nicht rückgängig gemacht werden.',
      async () => {
        const updated: IBestellung = { ...b, bestellungsZustand: BestellungsZustand.STORNIERT };
        await this.bestellungService.editBestellung(b.id, updated);
        this.bestellung.set(updated);
      }
    );
  }

  get total(): number {
    return this.bestellung()?.produkte.reduce((s,p) => s + p.preis * p.anzahl, 0) ?? 0;
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  getZustandLabel(z: BestellungsZustand): string {
    switch (z) {
      case BestellungsZustand.EINGEGANGEN:    return 'Eingegangen';
      case BestellungsZustand.IN_BEARBEITUNG: return 'In Bearbeitung';
      case BestellungsZustand.VERSANDT:       return 'Versandt';
      case BestellungsZustand.ANGEKOMMEN:     return 'Angekommen';
      case BestellungsZustand.STORNIERT:      return 'Storniert';
      default: return 'Unbekannt';
    }
  }

  getZustandClass(z: BestellungsZustand): string {
    switch (z) {
      case BestellungsZustand.ANGEKOMMEN:     return 'badge--success';
      case BestellungsZustand.VERSANDT:       return 'badge--neutral';
      case BestellungsZustand.STORNIERT:      return 'badge--error';
      default: return 'badge--warning';
    }
  }
}
