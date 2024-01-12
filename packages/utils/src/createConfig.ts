export interface CreateConfigParameters {
  endpoints?: {
    identity?: string;
    api?: string;
  };
  federation?: {
    id?: string;
    domain?: string;
  };
  modulePubkeys?: {
    card?: string;
    ledger?: string;
    urlx: string;
  };
  relaysList?: string;
}
