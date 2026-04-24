import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {Subscription} from 'rxjs';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {IUser} from '../../models/interfaces/IUser';
import {BestellungService} from '../../services/bestellung.service';
import {UserService} from '../../services/user.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {ShopSettingsService} from '../../services/shop-settings.service';
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
export class AdminBestellungDetails implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private bestellungService = inject(BestellungService);
  private userService = inject(UserService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);
  private settings = inject(ShopSettingsService);
  private location = inject(Location);

  protected bestellung = signal<IBestellung | null>(null);
  protected bestellungUser = signal<IUser | null>(null);
  protected loading = signal(true);
  protected saving = signal(false);
  protected selectedZustand: BestellungsZustand = BestellungsZustand.EINGEGANGEN;
  protected selectedZahlungsZustand: ZahlungsZustand = ZahlungsZustand.NOCH_AUSSTEHEND;

  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  private sub?: Subscription;
  private initialized = false;

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

    this.sub = this.bestellungService.watchBestellung(id).subscribe({
      next: async (b) => {
        this.bestellung.set(b ?? null);
        this.loading.set(false);
        if (b && !this.initialized) {
          this.initialized = true;
          // Dropdowns nur beim ersten Laden setzen, nicht bei späteren Live-Updates überschreiben
          this.selectedZustand = b.bestellungsZustand;
          this.selectedZahlungsZustand = b.zahlungsZustand;
          if (b.isNew) await this.bestellungService.markAsViewed(id);
          if (b.userId) {
            const user = await this.userService.getUserById(b.userId).catch(() => null);
            this.bestellungUser.set(user);
          }
        }
      },
      error: () => this.loading.set(false),
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async saveStatus() {
    const b = this.bestellung();
    if (!b) return;
    this.saving.set(true);
    try {
      const updated: IBestellung = { ...b, bestellungsZustand: this.selectedZustand, zahlungsZustand: this.selectedZahlungsZustand };
      await this.bestellungService.editBestellung(b.id, updated);
      this.bestellung.set(updated);
      this.dialogService.openMessage('Gespeichert', 'Status wurde erfolgreich aktualisiert.');
    } finally {
      this.saving.set(false);
    }
  }

  goBack() { this.location.back(); }

  getPaypalTransactionUrl(): string {
    const id = this.bestellung()?.paypalTransactionId ?? '';
    const base = this.settings.devBannerEnabled()
      ? 'https://www.sandbox.paypal.com/activity/payment/'
      : 'https://www.paypal.com/activity/payment/';
    return base + id;
  }

  getContactMailto(): string {
    const email = this.bestellungUser()?.email ?? '';
    const subject = encodeURIComponent(`Ihre Bestellung #${this.bestellung()?.id ?? ''}`);
    return `mailto:${email}?subject=${subject}`;
  }

  get produktpreisGesamt(): number {
    return (this.bestellung()?.produkte ?? []).reduce((s, p) => s + (p.preis ?? 0) * (p.anzahl ?? 0), 0);
  }

  get total(): number {
    return this.produktpreisGesamt + (this.bestellung()?.versand?.kosten ?? 0);
  }

  get versandDienstleisterLabel(): string {
    const d = this.bestellung()?.versand?.dienstleister ?? '';
    const map: Record<string, string> = { dhl: 'DHL', hermes: 'Hermes', dpd: 'DPD', ups: 'UPS', gls: 'GLS' };
    return map[d] ?? d;
  }

  get versandArtLabel(): string {
    const a = this.bestellung()?.versand?.art ?? '';
    const map: Record<string, string> = { standard: 'Standard', express: 'Express', overnight: 'Overnight' };
    return map[a] ?? a;
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p ?? 0);
  }

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }
}
