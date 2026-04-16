import {Component, inject} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us.html',
  styleUrl: './about-us.css',
})
export class AboutUs {
  private routingService = inject(RoutingService);

  goToShop() {
    this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW);
  }

  features = [
    {
      icon: 'local_shipping',
      title: 'Schnelle Lieferung',
      text: 'Bestellungen werden innerhalb von 24 Stunden versendet. Expresszustellung auf Wunsch verfügbar.'
    },
    {
      icon: 'lock',
      title: 'Sichere Bezahlung',
      text: 'Ihre Zahlungsdaten sind bei uns sicher. Wir unterstützen PayPal und weitere sichere Zahlungsmethoden.'
    },
    {
      icon: 'star',
      title: 'Kundenzufriedenheit',
      text: 'Über 10.000 zufriedene Kunden vertrauen uns. Ihre Zufriedenheit ist unsere höchste Priorität.'
    },
    {
      icon: 'support_agent',
      title: 'Persönlicher Support',
      text: 'Unser freundliches Support-Team ist montags bis freitags von 9–18 Uhr für Sie erreichbar.'
    },
    {
      icon: 'recycling',
      title: 'Nachhaltigkeit',
      text: 'Wir setzen auf umweltfreundliche Verpackungen und arbeiten mit nachhaltigen Lieferanten zusammen.'
    },
    {
      icon: 'verified',
      title: 'Qualitätsgarantie',
      text: 'Alle Produkte werden sorgfältig auf Qualität geprüft. 30-Tage-Rückgaberecht ohne Angabe von Gründen.'
    }
  ];

  team = [
    { name: 'Anna Müller', rolle: 'Gründerin & CEO', initial: 'A' },
    { name: 'Ben Schmidt', rolle: 'Head of Logistics', initial: 'B' },
    { name: 'Clara Weber', rolle: 'Customer Happiness', initial: 'C' }
  ];
}
