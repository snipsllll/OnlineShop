import {inject, Injectable} from '@angular/core';
import {MyRoutes} from '../models/enums/MyRoutes';
import {Router} from '@angular/router';
import {TopbarService} from '../Topbar/topbar.service';

@Injectable({
  providedIn: 'root',
})
export class RoutingService {
  private router = inject(Router);
  private topbarService = inject(TopbarService);

  public route(myRoute: MyRoutes, param?: string): void {
    const segments: string[] = [myRoute.toString()];
    if (param != null) segments.push(param);

    this.router.navigate(segments).then(() => {
      this.topbarService.setTopbarItems(myRoute);
    });
  }
}
