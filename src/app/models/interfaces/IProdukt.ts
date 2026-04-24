import {IImgRef} from './IImgRef';

export interface IRabatt {
  prozent: number;
  gueltigAb?: string;
  gueltigBis?: string;
}

export interface IProdukt {
  id: string;
  bezeichnung: string;
  beschreibung: string;
  preis: number;
  imgRefs: IImgRef[];
  verfuegbar: boolean;
  lagerbestand: number;
  reserviert?: number;
  kategorieId?: string;
  rabatt?: IRabatt;
}
