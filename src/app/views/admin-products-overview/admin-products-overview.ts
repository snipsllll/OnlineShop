import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IProdukt} from '../../models/interfaces/IProdukt';
import {ProduktService} from '../../services/produkt.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-admin-products-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products-overview.html',
  styleUrl: './admin-products-overview.css',
})
export class AdminProductsOverview implements OnInit {
  private produktService = inject(ProduktService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);

  protected produkte = signal<IProdukt[]>([]);
  protected loading = signal(true);
  protected searchText = '';

  async ngOnInit() {
    this.loading.set(true);
    try {
      this.produkte.set(await this.produktService.getProdukte());
    } finally {
      this.loading.set(false);
    }
  }

  get filteredProdukte(): IProdukt[] {
    if (!this.searchText.trim()) return this.produkte();
    const q = this.searchText.toLowerCase();
    return this.produkte().filter(p => p.bezeichnung.toLowerCase().includes(q) || p.id.toLowerCase().includes(q));
  }

  addProdukt() { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, 'new'); }
  editProdukt(id: string) { this.routingService.route(MyRoutes.ADMIN_PRODUCT_DETAILS, id); }

  deleteProdukt(id: string) {
    this.dialogService.openConfirm('Produkt löschen', 'Soll dieses Produkt wirklich gelöscht werden?', async () => {
      await this.produktService.deleteProdukt(id);
      this.produkte.update(p => p.filter(x => x.id !== id));
    });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p);
  }
}
