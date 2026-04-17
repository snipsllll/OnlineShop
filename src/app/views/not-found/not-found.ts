import {Component, inject} from '@angular/core';
import {RoutingService} from '../../services/routing.service';
import {MyRoutes} from '../../models/enums/MyRoutes';

@Component({
  selector: 'app-not-found',
  standalone: true,
  templateUrl: './not-found.html',
  styleUrl: './not-found.css',
})
export class NotFound {
  private routingService = inject(RoutingService);

  goHome() { this.routingService.route(MyRoutes.PRODUKTE_OVERVIEW); }
}
