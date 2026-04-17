import {Component, Input, Output, EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {IBestellung} from '../../models/interfaces/IBestellung';
import {BestellungsZustand} from '../../models/enums/BestellungsZustand';
import {ZahlungsZustand} from '../../models/enums/ZahlungsZustand';

@Component({
  selector: 'app-admin-bestellungen-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-bestellungen-overview-table.html',
  styleUrl: './admin-bestellungen-overview-table.css',
})
export class AdminBestellungenOverviewTable {
  @Input() bestellungen: IBestellung[] = [];
  @Output() detailsClicked = new EventEmitter<string>();
  @Output() deleteClicked = new EventEmitter<string>();

  protected readonly BestellungsZustand = BestellungsZustand;
  protected readonly ZahlungsZustand = ZahlungsZustand;

  getZustandLabel(z: BestellungsZustand): string {
    const labels: Record<number, string> = {
      [BestellungsZustand.EINGEGANGEN]: 'Eingegangen',
      [BestellungsZustand.IN_BEARBEITUNG]: 'In Bearbeitung',
      [BestellungsZustand.VERSANDT]: 'Versandt',
      [BestellungsZustand.ANGEKOMMEN]: 'Angekommen',
    };
    return labels[z] ?? 'Unbekannt';
  }

  getZustandClass(z: BestellungsZustand): string {
    if (z === BestellungsZustand.ANGEKOMMEN) return 'badge--success';
    if (z === BestellungsZustand.VERSANDT) return 'badge--neutral';
    if (z === BestellungsZustand.IN_BEARBEITUNG) return 'badge--warning';
    return 'badge--neutral';
  }

  formatDate(d: any): string {
    const date = typeof d?.toDate === 'function' ? d.toDate() : new Date(d);
    return date.toLocaleDateString('de-DE', { day:'2-digit', month:'2-digit', year:'numeric' });
  }

  formatPrice(p: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(p ?? 0);
  }

  getOrderTotal(b: IBestellung): number {
    return (b.produkte ?? []).reduce((s, p) => s + (p.preis ?? 0) * (p.anzahl ?? 0), 0);
  }

  onDetails(id: string) { this.detailsClicked.emit(id); }
  onDelete(id: string) { this.deleteClicked.emit(id); }
}
