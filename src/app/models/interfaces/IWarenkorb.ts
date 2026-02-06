import {IProduktMitAnzahl} from './IProduktMitAnzahl';

export interface IWarenkorb {
  id: string;
  produkteMitAnzahl: IProduktMitAnzahl[];
  gesamtPreis: number;
}
