import {IBestellPosition} from './IBestellPosition';
import {IAdresse} from './IAdresse';
import {BestellungsZustand} from '../enums/BestellungsZustand';
import {ZahlungsZustand} from '../enums/ZahlungsZustand';

export interface IBestellung {
  id: string;
  userId: string;
  produkte: IBestellPosition[];
  bestelldatum: Date;
  lieferadresse: IAdresse;
  bestellungsZustand: BestellungsZustand;
  zahlungsZustand: ZahlungsZustand;
  isNew?: boolean;
}
