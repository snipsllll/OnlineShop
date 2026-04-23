import {Component, inject, OnInit, signal, ViewChild} from '@angular/core';
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
import {UserService} from '../../services/user.service';
import {ShopSettingsService} from '../../services/shop-settings.service';
import {AuthService} from '../../services/auth.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {PaypalButton} from '../../components/paypal-button/paypal-button';

type CheckoutStep = 'address' | 'payment';
type PaymentMethod = 'paypal' | 'card' | 'paylater';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, PaypalButton],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout implements OnInit {
  private warenkorbService = inject(WarenkorbService);
  private produktService = inject(ProduktService);
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private userService = inject(UserService);
  protected authService = inject(AuthService);
  private dialogService = inject(DialogService);
  protected settings = inject(ShopSettingsService);

  protected loading = signal(true);
  protected submitting = signal(false);
  protected addressPrefilled = signal(false);
  protected cartProdukte = signal<Array<{produkt: IProdukt, anzahl: number}>>([]);
  protected step = signal<CheckoutStep>('address');

  protected adresse: Partial<IAdresse> = { vorname: '', nachname: '', strasse: '', hausnummer: '', plz: '', ort: '', land: 'Deutschland' };
  protected paymentMethod: PaymentMethod = 'paypal';
  protected paypalReady = signal(false);
  protected cardReady = signal(false);
  protected paylaterReady = signal(false);

  @ViewChild('paypalFundingPaypal') private paypalFundingPaypal?: PaypalButton;
  @ViewChild('paypalFundingCard') private paypalFundingCard?: PaypalButton;
  @ViewChild('paypalFundingPaylater') private paypalFundingPaylater?: PaypalButton;

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [wk, alleProdukte] = await Promise.all([
        this.warenkorbService.getWahrenkorb(),
        this.produktService.getProdukte(),
      ]);
      const items = (wk.produkteMitAnzahl ?? []).map(p => {
        const produkt = alleProdukte.find(ap => ap.id === p.produktId);
        return produkt ? { produkt, anzahl: p.anzahl } : null;
      }).filter((x): x is {produkt: IProdukt, anzahl: number} => x !== null);
      this.cartProdukte.set(items);

      // Adresse aus Profil vorausfüllen, falls vorhanden
      try {
        const user = await this.userService.getCurrentUser();
        const a = user.adresse;
        if (a?.strasse) {
          this.adresse = {
            vorname: user.vorname ?? '',
            nachname: user.nachname ?? '',
            strasse: a.strasse ?? '',
            hausnummer: a.hausnummer ?? '',
            plz: a.plz ?? '',
            ort: a.ort ?? '',
            land: a.land || 'Deutschland',
          };
          this.addressPrefilled.set(true);
        }
      } catch {
        // Nicht eingeloggt oder keine Adresse – Formular bleibt leer
      }
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

  get paymentMethodLabel(): string {
    switch (this.paymentMethod) {
      case 'paypal':
        return 'PayPal';
      case 'card':
        return 'Kreditkarte';
      case 'paylater':
        return 'Später bezahlen';
      default:
        return this.paymentMethod;
    }
  }

  get selectedPaymentReady(): boolean {
    switch (this.paymentMethod) {
      case 'paypal':
        return this.paypalReady();
      case 'card':
        return this.cardReady();
      case 'paylater':
        return this.paylaterReady();
      default:
        return false;
    }
  }

  continueToPayment() {
    if (!this.isFormValid) return;
    this.step.set('payment');
  }

  backToAddress() {
    this.step.set('address');
  }

  async pay() {
    console.log(1)
    if (this.submitting()) return;
    if (!this.authService.isLoggedIn()) {
      this.dialogService.openLogin();
      return;
    }
    if (!this.isFormValid) {
      this.step.set('address');
      return;
    }

    const opened = this.openSelectedPaymentDialog();
    if (!opened) {
      this.dialogService.openMessage(
        'Zahlung wird geladen',
        'Der Zahlungsdialog ist noch nicht bereit. Bitte versuche es in ein paar Sekunden erneut.'
      );
    }
  }

  private openSelectedPaymentDialog(): boolean {
    switch (this.paymentMethod) {
      case 'paypal':
        return this.paypalFundingPaypal?.open() ?? false;
      case 'card':
        return this.paypalFundingCard?.open() ?? false;
      case 'paylater':
        return this.paypalFundingPaylater?.open() ?? false;
      default:
        return false;
    }
  }

  onPaymentReady(method: PaymentMethod, ready: boolean) {
    if (method === 'paypal') this.paypalReady.set(ready);
    if (method === 'card') this.cardReady.set(ready);
    if (method === 'paylater') this.paylaterReady.set(ready);
  }

  private pendingTransactionId: string | undefined;

  onTransactionId(transactionId: string) {
    this.pendingTransactionId = transactionId;
  }

  onPaymentResult(method: PaymentMethod, ok: boolean) {
    if (!ok) {
      this.pendingTransactionId = undefined;
      this.dialogService.openMessage('Zahlung abgebrochen', 'Die Zahlung wurde abgebrochen oder ist fehlgeschlagen.');
      return;
    }
    const transactionId = this.pendingTransactionId;
    this.pendingTransactionId = undefined;
    void this.submitOrder({ paid: true, paymentMethod: method, transactionId });
  }

  async submitOrder(opts?: { paid?: boolean; paymentMethod?: PaymentMethod; transactionId?: string }) {
    if (!this.authService.isLoggedIn()) {
      this.dialogService.openLogin();
      return;
    }
    this.submitting.set(true);
    try {
      const positionen: IBestellPosition[] = this.cartProdukte().map(i => ({
        id: i.produkt.id,
        bezeichnung: i.produkt.bezeichnung,
        preis: i.produkt.preis,
        anzahl: i.anzahl
      }));
      const paid = !!opts?.paid;
      const bestellung: IBestellung = {
        id: '',
        userId: this.authService.currentUid()!,
        produkte: positionen,
        bestelldatum: new Date(),
        lieferadresse: this.adresse as IAdresse,
        bestellungsZustand: BestellungsZustand.EINGEGANGEN,
        zahlungsZustand: ZahlungsZustand.NOCH_AUSSTEHEND,
        isNew: true,
        ...(opts?.transactionId ? { paypalTransactionId: opts.transactionId } : {}),
      };
      await this.bestellungService.addBestellung(bestellung);
      await this.warenkorbService.clearWarenkorb();
      this.routingService.route(MyRoutes.PAYMENT_APPROVAL, String(opts?.paymentMethod ?? this.paymentMethod));
    } finally {
      this.submitting.set(false);
    }
  }

  get isFormValid(): boolean {
    const a = this.adresse;
    return !!(a.vorname && a.nachname && a.strasse && a.hausnummer && a.plz && a.ort && a.land);
  }
}
