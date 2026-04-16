import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungService} from '../../services/bestellung.service';
import {RoutingService} from '../../services/routing.service';
import {DialogService} from '../../services/dialog.service';
import {MyRoutes} from '../../models/enums/MyRoutes';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {AdminBestellungenOverviewTable} from '../../components/admin-bestellungen-overview-table/admin-bestellungen-overview-table';

@Component({
  selector: 'app-admin-bestellungen-overview',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminBestellungenOverviewTable],
  templateUrl: './admin-bestellungen-overview.html',
  styleUrl: './admin-bestellungen-overview.css',
})
export class AdminBestellungenOverview implements OnInit {
  private bestellungService = inject(BestellungService);
  private routingService = inject(RoutingService);
  private dialogService = inject(DialogService);

  protected bestellungen = signal<IBestellung[]>([]);
  protected loading = signal(true);
  protected filterZustand = 'all';

  async ngOnInit() {
    this.loading.set(true);
    try {
      const all = await this.bestellungService.getBestellungen();
      this.bestellungen.set(all.sort((a,b) => new Date(b.bestelldatum).getTime() - new Date(a.bestelldatum).getTime()));
    } finally {
      this.loading.set(false);
    }
  }

  get filteredBestellungen(): IBestellung[] {
    if (this.filterZustand === 'all') return this.bestellungen();
    const z = parseInt(this.filterZustand);
    return this.bestellungen().filter(b => b.bestellungsZustand === z);
  }

  onDetails(id: string) { this.routingService.route(MyRoutes.ADMIN_BESTELLUNG_DETAILS, id); }

  onDelete(id: string) {
    this.dialogService.openConfirm('Bestellung löschen', 'Soll diese Bestellung wirklich gelöscht werden?', async () => {
      await this.bestellungService.deleteBestellung(id);
      this.bestellungen.update(b => b.filter(x => x.id !== id));
    });
  }

  countByZustand(z: BestellungsZustand): number {
    return this.bestellungen().filter(b => b.bestellungsZustand === z).length;
  }

  protected readonly BestellungsZustand = BestellungsZustand;
}
