export type RoutingInfo = Array<{
  pubkey: string;
  short_channel_id: string;
  fee_base_msat: number;
  fee_proportional_millionths: number;
  cltv_expiry_delta: number;
}>;
type FallbackAddress = {
  code: number;
  address: string;
  addressHash: string;
};

export type FeatureBitOrder =
  | 'option_data_loss_protect'
  | 'initial_routing_sync'
  | 'option_upfront_shutdown_script'
  | 'gossip_queries'
  | 'var_onion_optin'
  | 'gossip_queries_ex'
  | 'option_static_remotekey'
  | 'payment_secret'
  | 'basic_mpp'
  | 'option_support_large_channel';

export type FeatureBits = {
  word_length: number;
  extra_bits?: {
    start_bit: number;
    bits: boolean[];
    has_required?: boolean;
  };
} & Record<FeatureBitOrder, Feature>;

type Feature = {
  required?: boolean;
  supported?: boolean;
};

export type Network = {
  [index: string]: any;
  bech32: string;
  pubKeyHash: number;
  scriptHash: number;
  validWitnessVersions: number[];
};

type UnknownTag = {
  tagCode: number;
  words: string;
};

// Start exports
export declare type TagData = string | number | RoutingInfo | FallbackAddress | FeatureBits | UnknownTag;
export declare type TagsObject = {
  payment_hash?: string;
  payment_secret?: string;
  description?: string;
  payee_node_key?: string;
  purpose_commit_hash?: string;
  expire_time?: number;
  min_final_cltv_expiry?: number;
  fallback_address?: FallbackAddress;
  routing_info?: RoutingInfo;
  feature_bits?: FeatureBits;
  unknownTags?: UnknownTag[];
};

export type TagsType = Array<{
  tagName: string;
  data: TagData;
}>;

type RouteHint = {
  pubkey: string;
  short_channel_id: string;
  fee_base_msat: number;
  fee_proportional_millionths: number;
  cltv_expiry_delta: number;
};

type Section =
  | {
      name: 'lightning_network';
      letters: string;
    }
  | {
      name: 'coin_network';
      letters: string;
      value: {
        bech32: string;
        pubKeyHash: number;
        scriptHash: number;
        validWitnessVersions: number[];
      };
    }
  | {
      name: 'amount';
      letters: string;
      value: string;
    }
  | {
      name: 'separator';
      letters: string;
    }
  | {
      name: 'timestamp';
      letters: string;
      value: number;
    }
  | {
      name: 'payment_hash' | 'description' | 'payment_secret' | 'expiry' | 'min_final_cltv_expiry';
      tag: string;
      letters: string;
      value: string | number;
    }
  | {
      name: 'feature_bits';
      tag: string;
      letters: string;
      value: FeatureBits;
    }
  | {
      name: 'route_hint';
      tag: string;
      letters: string;
      value: RouteHint[];
    }
  | {
      name: 'signature';
      letters: string;
      value: string;
    }
  | {
      name: 'checksum';
      letters: string;
    };

export type PaymentRequestObject = {
  paymentRequest: string;
  sections: Section[];
  expiry: number;
  route_hints: RouteHint[][];
};
