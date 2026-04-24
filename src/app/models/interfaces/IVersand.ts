export type Dienstleister = 'dhl' | 'hermes' | 'dpd' | 'ups' | 'gls';
export type VersandArt = 'standard' | 'express' | 'overnight';

export interface IVersand {
  dienstleister: Dienstleister;
  art: VersandArt;
  mitTracking: boolean;
  kosten: number;
  lieferzeit: string;
}
