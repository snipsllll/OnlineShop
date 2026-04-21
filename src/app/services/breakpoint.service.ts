import {Injectable, signal} from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreakpointService {
  readonly isMobile = signal(window.innerWidth < 640);

  constructor() {
    window.addEventListener('resize', () => {
      this.isMobile.set(window.innerWidth < 640);
    });
  }
}
