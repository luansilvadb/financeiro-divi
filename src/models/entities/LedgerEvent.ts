export type LedgerEventType = 
  | 'GASTO_LANCADO' 
  | 'GASTO_ESTORNADO' 
  | 'FATURA_FECHADA' 
  | 'ACERTO_REGISTRADO' 
  | 'MEMBRO_ADICIONADO'
  | 'MIGRACAO_ESTADO_INICIAL';

export interface LedgerEvent<T = any> {
  id: string;
  type: LedgerEventType;
  timestamp: number;
  version: number;
  payload: T;
}

export interface GastoLancadoPayload {
  id: string;
  faturaId: string;
  compradorId: string;
  valorCentavos: number;
  divisoes: { membroId: string; valorCentavos: number }[];
  descricao: string;
  paymentMethod: 'pix' | 'card';
  cardOwnerId?: string | null;
}
