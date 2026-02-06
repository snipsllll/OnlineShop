import {Rolle} from '../enums/Rolle';
import {IAdresse} from './IAdresse';
import {IProdukt} from './IProdukt';
import {IWarenkorb} from './IWarenkorb';
import {IBestellung} from './IBestellung';



export interface IFIreUser {
  id?: string;
  uid: string;
  email: string;
  displayName?: string;
}

export interface IUser extends IFIreUser {
  email: string;
  rolle: Rolle;
  adresse: IAdresse;
  vorname: string;
  nachname: string;
  telefonnummer: string;
  favorisierteProduktIds: string[];
  favorisierteProdukte: IProdukt[];
  warenkorb: IWarenkorb;
  bestellungsIds: string[];
  bestellungen: IBestellung[];
}
