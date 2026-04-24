import {Injectable} from '@angular/core';

export interface AdminProductsState {
  page: number;
  pageSize: number;
  searchText: string;
  filterBezeichnung: string;
  filterPreisMin: string;
  filterPreisMax: string;
  filterLagerMin: string;
  filterLagerMax: string;
  filterVerfuegbar: 'all' | 'true' | 'false';
  filterHasImage: 'all' | 'yes' | 'no';
  sortCol: string | null;
  sortDir: 'asc' | 'desc';
  scrollY: number;
}

@Injectable({providedIn: 'root'})
export class AdminProductsStateService {
  state: AdminProductsState | null = null;
}
