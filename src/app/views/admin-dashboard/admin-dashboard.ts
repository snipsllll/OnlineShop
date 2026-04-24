import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {AdminProductsStateService} from '../../services/admin-products-state.service';
import {AdminBestellungenStateService} from '../../services/admin-bestellungen-state.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {AdminNav} from '../../components/admin-nav/admin-nav';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, AdminNav],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  private produktService = inject(ProduktService);
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private stateService = inject(AdminProductsStateService);
  private bestellungenStateService = inject(AdminBestellungenStateService);

  protected loading = signal(true);
  protected produktCount = signal(0);
  protected bestellungen = signal<IBestellung[]>([]);
  protected lowStockProdukte = signal<IProdukt[]>([]);
  protected unavailableCount = signal(0);

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [count, orders, allProdukte] = await Promise.all([
        this.produktService.getProduktCount(),
        this.bestellungService.getBestellungen(),
        this.produktService.getProdukte(),
      ]);
      this.produktCount.set(count);
      this.bestellungen.set(orders);
      this.lowStockProdukte.set(
        allProdukte
          .filter(p => p.verfuegbar && p.lagerbestand <= 5)
          .sort((a, b) => a.lagerbestand - b.lagerbestand)
      );
      this.unavailableCount.set(allProdukte.filter(p => !p.verfuegbar).length);
    } finally {
      this.loading.set(false);
    }
  }

  get countAktuelle(): number {
    return this.bestellungen().filter(b => {
      const z = Number(b.bestellungsZustand);
      return z !== BestellungsZustand.ANGEKOMMEN && z !== BestellungsZustand.STORNIERT;
    }).length;
  }
  get countUnviewed(): number { return this.bestellungen().filter(b => b.isNew === true).length; }

  get recentBestellungen(): IBestellung[] {
    return [...this.bestellungen()]
      .sort((a, b) => new Date(b.bestelldatum).getTime() - new Date(a.bestelldatum).getTime())
      .slice(0, 6);
  }

  statusLabel(z: BestellungsZustand): string {
    switch (z) {
      case BestellungsZustand.EINGEGANGEN:    return 'Neu';
      case BestellungsZustand.IN_BEARBEITUNG: return 'In Bearbeitung';
      case BestellungsZustand.VERSANDT:       return 'Versandt';
      case BestellungsZustand.ANGEKOMMEN:     return 'Angekommen';
      case BestellungsZustand.STORNIERT:      return 'Storniert';
      default: return '—';
    }
  }

  statusClass(z: BestellungsZustand): string {
    switch (z) {
      case BestellungsZustand.EINGEGANGEN:    return 'badge--warning';
      case BestellungsZustand.IN_BEARBEITUNG: return 'badge--info';
      case BestellungsZustand.VERSANDT:       return 'badge--purple';
      case BestellungsZustand.ANGEKOMMEN:     return 'badge--success';
      case BestellungsZustand.STORNIERT:      return 'badge--error';
      default: return 'badge--neutral';
    }
  }

  formatDate(d: any): string {
    if (!d) return '—';
    const date = d?.toDate ? d.toDate() : new Date(d);
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  goProducts()      { this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW); }
  goUnavailableProducts() {
    this.stateService.state = {
      page: 1, pageSize: 20, searchText: '', filterBezeichnung: '',
      filterPreisMin: '', filterPreisMax: '', filterLagerMin: '', filterLagerMax: '',
      filterVerfuegbar: 'false', filterHasImage: 'all', filterKategorie: 'all',
      sortCol: null, sortDir: 'asc', scrollY: 0,
    };
    this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW);
  }
  goOrders()        { this.routingService.route(MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW); }
  goNewOrders() {
    this.bestellungenStateService.state = { viewMode: 'alle', filterZustand: 'all', filterNeu: true, searchText: '' };
    this.routingService.route(MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW);
  }
  goNewProduct()    { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new'); }
  goOrderDetails(id: string) { this.routingService.route(MyRoutes.ADMIN_BESTELLUNG_DETAILS, id); }
  goProductDetails(id: string) { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, id); }
}
