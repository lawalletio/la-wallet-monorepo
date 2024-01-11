export type ConfigProps = {
  gatewayEndpoint: string;
  relaysList: string[];
  federation: {
    id: string;
    domain: string;
    identityEndpoint: string;
  };
  modulePubkeys: {
    card: string;
    ledger: string;
    urlx: string;
  };
};
