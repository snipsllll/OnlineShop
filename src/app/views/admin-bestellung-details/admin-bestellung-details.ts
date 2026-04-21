import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {RouteParams} from '../../models/enums/RouteParams';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-bestellung-details',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNav],
  templateUrl: './admin-bestellung-details.html',
  styleUrl: './admin-bestellung-details.css',
})
export class AdminBestellungDetails implements OnInit {
  private route = inject(ActivatedRoute);
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);
  private location = inject(Location);

  protected bestellung = signal<IBestellung | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected selectedZustand: BestellungsZustand = BestellungsZustand.EINGEGANGEN;
  protected selectedZahlungsZustand: ZahlungsZustand = ZahlungsZustand.NOCH_AUSSTEHEND;

  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  readonly zustandOptions = [
    { value: BestellungsZustand.EINGEGANGEN, label: 'Eingegangen' },
    { value: BestellungsZustand.IN_BEARBEITUNG, label: 'In Bearbeitung' },
    { value: BestellungsZustand.VERSANDT, label: 'Versandt' },
    { value: BestellungsZustand.ANGEKOMMEN, label: 'Angekommen' },
    { value: BestellungsZustand.STORNIERT, label: 'Storniert' },
  ];

  readonly zahlungsOptions = [
    { value: ZahlungsZustand.NOCH_AUSSTEHEND, label: 'Ausstehend' },
    { value: ZahlungsZustand.BEZAHLT, label: 'Bezahlt' },
  ];

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get(RouteParams.BESTELLUNGS_ID);
    if (!id) return;
    this.loading.set(true);
    try {
      const b = await this.bestellungService.getBestellung(id);
      this.bestellung.set(b ?? null);
      if (b) {
        this.selectedZustand = b.bestellungsZustand;
        this.selectedZahlungsZustand = b.zahlungsZustand;
        if (b.isNew) {
          await this.bestellungService.markAsViewed(id);
        }
      }
    } finally {
      this.loading.set(false);
    }
  }

  async saveStatus() {
    const b = this.bestellung();
    if (!b) return;
    this.saving.set(true);
    try {
      b.bestellungsZustand = this.selectedZustand;
      b.zahlungsZustand = this.selectedZahlungsZustand;
      await this.bestellungService.editBestellung(b.id, b);
      this.bestellung.set({...b});
      this.dialogService.openMessage('Gespeichert', 'Status wurde erfolgreich aktualisiert.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.location.back(); }

  get total(): number {
    return (this.bestellung()?.produkte ?? []).reduce((s, p) => s + (p.preis ?? 0) * (p.anzahl ?? 0), 0);
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p ?? 0);
  }

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
