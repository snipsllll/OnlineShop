import {Injectable} from '@angular/core';
import {BestellungsZustand} from '../models/enums/BestellungsZustand';

export interface AdminBestellungenState {
  viewMode: 'aktuelle' | 'alle';
  filterZustand: BestellungsZustand | 'all';
  filterNeu: boolean;
  searchText: string;
}

@Injectable({providedIn: 'root'})
export class AdminBestellungenStateService {
  state: AdminBestellungenState | null = null;
}
