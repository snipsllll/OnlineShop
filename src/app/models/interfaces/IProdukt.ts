import {IImgRef} from './IImgRef';

export interface IProdukt {
  id: string;
  bezeichnung: string;
  beschreibung: string;
  preis: number;
  imgRefs: IImgRef[];
  verfuegbar: boolean;
  lagerbestand: number;
  kategorieId?: string;
}
