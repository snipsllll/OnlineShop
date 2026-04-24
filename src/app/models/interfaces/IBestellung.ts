import {IBestellPosition} from './IBestellPosition';
import {IAdresse} from './IAdresse';
import {IVersand} from './IVersand';
import {BestellungsZustand} from '../enums/BestellungsZustand';
import {ZahlungsZustand} from '../enums/ZahlungsZustand';

export interface IBestellung {
  id: string;
  userId: string;
  produkte: IBestellPosition[];
  bestelldatum: Date;
  lieferadresse: IAdresse;
  versand?: IVersand;
  bestellungsZustand: BestellungsZustand;
  zahlungsZustand: ZahlungsZustand;
  isNew?: boolean;
  paypalTransactionId?: string;
  lagerbestandAngepasst?: boolean;
  erstattungsId?: string;
  erstattungsDatum?: any;
}
