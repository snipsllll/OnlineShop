import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {ProduktService} from '../../services/produkt.service';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
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

  protected loading = signal(true);
  protected produktCount = signal(0);
  protected bestellungen = signal<IBestellung[]>([]);

  async ngOnInit() {
    this.loading.set(true);
    try {
      const [count, orders] = await Promise.all([
        this.produktService.getProduktCount(),
        this.bestellungService.getBestellungen(),
      ]);
      this.produktCount.set(count);
      this.bestellungen.set(orders);
    } finally {
      this.loading.set(false);
    }
  }

  get countGesamt(): number { return this.bestellungen().length; }
  get countNeu(): number { return this.bestellungen().filter(b => b.bestellungsZustand === BestellungsZustand.EINGEGANGEN).length; }
  get countInBearbeitung(): number { return this.bestellungen().filter(b => b.bestellungsZustand === BestellungsZustand.IN_BEARBEITUNG).length; }
  get countVersandt(): number { return this.bestellungen().filter(b => b.bestellungsZustand === BestellungsZustand.VERSANDT).length; }
  get countAngekommen(): number { return this.bestellungen().filter(b => b.bestellungsZustand === BestellungsZustand.ANGEKOMMEN).length; }

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
      default: return '—';
    }
  }

  statusClass(z: BestellungsZustand): string {
    switch (z) {
      case BestellungsZustand.EINGEGANGEN:    return 'badge--warning';
      case BestellungsZustand.IN_BEARBEITUNG: return 'badge--info';
      case BestellungsZustand.VERSANDT:       return 'badge--purple';
      case BestellungsZustand.ANGEKOMMEN:     return 'badge--success';
      default: return 'badge--neutral';
    }
  }

  formatDate(d: any): string {
    if (!d) return '—';
    const date = d?.toDate ? d.toDate() : new Date(d);
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  }

  goProducts()      { this.routingService.route(MyRoutes.ADMIN_PRODUCTS_OVERVIEW); }
  goOrders()        { this.routingService.route(MyRoutes.ADMIN_BESTELLUNGEN_OVERVIEW); }
  goNewProduct()    { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new'); }
  goOrderDetails(id: string) { this.routingService.route(MyRoutes.ADMIN_BESTELLUNG_DETAILS, id); }
}
