'use strict';
import crypto from 'crypto';
import { bech32 } from '@scure/base';
import * as secp from '@noble/secp256k1';
import type {
  FeatureBits,
  Network,
  FeatureBitOrder,
  PaymentRequestObject,
  TagsType,
  DecodedInvoiceReturns,
} from '../types/bolt11.js';

// defaults for encode; default timestamp is current time at call
const DEFAULTNETWORK = {
  // default network is bitcoin
  bech32: 'bc',
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  validWitnessVersions: [0, 1],
};
const TESTNETWORK = {
  bech32: 'tb',
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  validWitnessVersions: [0, 1],
};
const REGTESTNETWORK = {
  bech32: 'bcrt',
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  validWitnessVersions: [0, 1],
};
const SIMNETWORK = {
  bech32: 'sb',
  pubKeyHash: 0x3f,
  scriptHash: 0x7b,
  validWitnessVersions: [0, 1],
};
// const DEFAULTEXPIRETIME = 3600;
// const DEFAULTCLTVEXPIRY = 9;
// const DEFAULTDESCRIPTION = '';
// const DEFAULTFEATUREBITS = {
//   word_length: 4, // last bit set default is 15
//   var_onion_optin: {
//     required: false,
//     supported: true,
//   },
//   payment_secret: {
//     required: false,
//     supported: true,
//   },
// };

const FEATUREBIT_ORDER: FeatureBitOrder[] = [
  'option_data_loss_protect',
  'initial_routing_sync',
  'option_upfront_shutdown_script',
  'gossip_queries',
  'var_onion_optin',
  'gossip_queries_ex',
  'option_static_remotekey',
  'payment_secret',
  'basic_mpp',
  'option_support_large_channel',
];

const DIVISORS: Record<string, bigint> = {
  m: BigInt(1e3),
  u: BigInt(1e6),
  n: BigInt(1e9),
  p: BigInt(1e12),
};

const MAX_MILLISATS = BigInt('2100000000000000000');

const MILLISATS_PER_BTC = BigInt(1e11);
const MILLISATS_PER_MILLIBTC = BigInt(1e8);
const MILLISATS_PER_MICROBTC = BigInt(1e5);
const MILLISATS_PER_NANOBTC = BigInt(1e2);
const PICOBTC_PER_MILLISATS = BigInt(10);

const TAGCODES: Record<string, number> = {
  payment_hash: 1,
  payment_secret: 16,
  description: 13,
  payee_node_key: 19,
  purpose_commit_hash: 23, // commit to longer descriptions (like a website)
  expire_time: 6, // default: 3600 (1 hour)
  min_final_cltv_expiry: 24, // default: 9
  fallback_address: 9,
  routing_info: 3, // for extra routing info (private etc.)
  feature_bits: 5,
};

// reverse the keys and values of TAGCODES and insert into TAGNAMES
const TAGNAMES: Record<string, string> = {};
const keys: string[] = Object.keys(TAGCODES);

for (let i = 0; i < keys.length; i++) {
  const currentName: string = keys[i]!;
  const currentCode: string = TAGCODES[currentName]!.toString();
  TAGNAMES[currentCode] = currentName;
}

const TAGPARSERS: Record<string, any> = {
  1: (words: number[]) => wordsToBuffer(words, true).toString('hex'), // 256 bits
  16: (words: number[]) => wordsToBuffer(words, true).toString('hex'), // 256 bits
  13: (words: number[]) => wordsToBuffer(words, true).toString('utf8'), // string variable length
  19: (words: number[]) => wordsToBuffer(words, true).toString('hex'), // 264 bits
  23: (words: number[]) => wordsToBuffer(words, true).toString('hex'), // 256 bits
  6: wordsToIntBE, // default: 3600 (1 hour)
  24: wordsToIntBE, // default: 9
  3: routingInfoParser, // for extra routing info (private etc.)
  5: featureBitsParser, // keep feature bits as array of 5 bit words
};

const unknownTagName = 'unknownTag';

function getUnknownParser(tagCode: string) {
  return (words: number[]) => ({
    tagCode: parseInt(tagCode),
    words: bech32.encode('unknown', words, Number.MAX_SAFE_INTEGER),
  });
}

function wordsToIntBE(words: number[]) {
  return words.reverse().reduce((total, item, index) => {
    return total + item * Math.pow(32, index);
  }, 0);
}

function intBEToWords(intBE: number, bits: number | undefined) {
  const words = [];
  if (bits === undefined) bits = 5;
  intBE = Math.floor(intBE);
  if (intBE === 0) return [0];
  while (intBE > 0) {
    words.push(intBE & (Math.pow(2, bits) - 1));
    intBE = Math.floor(intBE / Math.pow(2, bits));
  }
  return words.reverse();
}

function convert(data: number[], inBits: number, outBits: number) {
  let value = 0;
  let bits = 0;
  const maxV = (1 << outBits) - 1;

  const result = [];
  for (let i = 0; i < data.length; ++i) {
    value = (value << inBits) | data[i]!;
    bits += inBits;

    while (bits >= outBits) {
      bits -= outBits;
      result.push((value >> bits) & maxV);
    }
  }

  if (bits > 0) {
    result.push((value << (outBits - bits)) & maxV);
  }

  return result;
}

function wordsToBuffer(words: number[], trim: boolean) {
  let buffer = Buffer.from(convert(words, 5, 8));
  if (trim && (words.length * 5) % 8 !== 0) {
    buffer = buffer.slice(0, -1);
  }
  return buffer;
}

function hexToBuffer(hex: String) {
  if (hex !== undefined && (typeof hex === 'string' || hex instanceof String) && hex.match(/^([a-zA-Z0-9]{2})*$/)) {
    return Buffer.from(hex, 'hex');
  }

  return hex;
}

function textToBuffer(text: string) {
  return Buffer.from(text, 'utf8');
}

function hexToWord(hex: string) {
  const buffer = hexToBuffer(hex) as Buffer;
  return bech32.toWords(buffer);
}

function textToWord(text: string) {
  const buffer = textToBuffer(text);
  const words = bech32.toWords(buffer);
  return words;
}

// the code is the witness version OR 17 for P2PKH OR 18 for P2SH
// anything besides code 17 or 18 should be bech32 or bech32m encoded address.
// 1 word for the code, and right pad with 0 if necessary for the addressHash
// (address parsing for encode is done in the encode function)
function fallbackAddressEncoder(data: Record<string, any>) {
  return [data.code].concat(hexToWord(data.addressHash));
}

// first convert from words to buffer, trimming padding where necessary
// parse in 51 byte chunks. See encoder for details.
function routingInfoParser(words: number[]) {
  const routes = [];
  let pubkey, shortChannelId, feeBaseMSats, feeProportionalMillionths, cltvExpiryDelta;
  let routesBuffer = wordsToBuffer(words, true);
  while (routesBuffer.length > 0) {
    pubkey = routesBuffer.slice(0, 33).toString('hex'); // 33 bytes
    shortChannelId = routesBuffer.slice(33, 41).toString('hex'); // 8 bytes
    feeBaseMSats = parseInt(routesBuffer.slice(41, 45).toString('hex'), 16); // 4 bytes
    feeProportionalMillionths = parseInt(routesBuffer.slice(45, 49).toString('hex'), 16); // 4 bytes
    cltvExpiryDelta = parseInt(routesBuffer.slice(49, 51).toString('hex'), 16); // 2 bytes

    routesBuffer = routesBuffer.slice(51);

    routes.push({
      pubkey,
      short_channel_id: shortChannelId,
      fee_base_msat: feeBaseMSats,
      fee_proportional_millionths: feeProportionalMillionths,
      cltv_expiry_delta: cltvExpiryDelta,
    });
  }
  return routes;
}

function featureBitsParser(words: number[]) {
  const bools = words
    .slice()
    .reverse()
    .map((word) => [!!(word & 0b1), !!(word & 0b10), !!(word & 0b100), !!(word & 0b1000), !!(word & 0b10000)])
    .reduce((finalArr, itemArr) => finalArr.concat(itemArr), []);
  while (bools.length < FEATUREBIT_ORDER.length * 2) {
    bools.push(false);
  }
  const featureBits: Record<string, any> = {
    word_length: words.length,
  };

  FEATUREBIT_ORDER.forEach((featureName: string, index: number) => {
    featureBits[featureName] = {
      required: bools[index * 2],
      supported: bools[index * 2 + 1],
    };
  });
  if (bools.length > FEATUREBIT_ORDER.length * 2) {
    const extraBits = bools.slice(FEATUREBIT_ORDER.length * 2);
    featureBits.extra_bits = {
      start_bit: FEATUREBIT_ORDER.length * 2,
      bits: extraBits,
      has_required: extraBits.reduce(
        (result, bit, index) => (index % 2 !== 0 ? result || false : result || bit),
        false,
      ),
    };
  } else {
    featureBits.extra_bits = {
      start_bit: FEATUREBIT_ORDER.length * 2,
      bits: [],
      has_required: false,
    };
  }
  return featureBits;
}

function featureBitsEncoder(featureBits: FeatureBits) {
  let wordsLength = featureBits.word_length;
  let bools: boolean[] = [];
  FEATUREBIT_ORDER.forEach((featureName: FeatureBitOrder) => {
    bools.push(!!(featureBits[featureName] || {}).required);
    bools.push(!!(featureBits[featureName] || {}).supported);
  });
  // Make sure that only minimal number of bits is encoded
  while (bools[bools.length - 1] === false) {
    bools.pop();
  }
  while (bools.length % 5 !== 0) {
    bools.push(false);
  }
  if (featureBits.extra_bits && Array.isArray(featureBits.extra_bits.bits) && featureBits.extra_bits.bits.length > 0) {
    while (bools.length < featureBits.extra_bits.start_bit) {
      bools.push(false);
    }
    bools = bools.concat(featureBits.extra_bits.bits);
  }
  if (wordsLength !== undefined && bools.length / 5 > wordsLength) {
    throw new Error('word_length is too small to contain all featureBits');
  } else if (wordsLength === undefined) {
    wordsLength = Math.ceil(bools.length / 5);
  }
  return new Array(wordsLength)
    .fill(0)
    .map(
      (_, index) =>
        (((bools[index * 5 + 4] ?? 0) as number) << 4) |
        (((bools[index * 5 + 3] ?? 0) as number) << 3) |
        (((bools[index * 5 + 2] ?? 0) as number) << 2) |
        (((bools[index * 5 + 1] ?? 0) as number) << 1) |
        (((bools[index * 5] ?? 0) as number) << 0),
    )
    .reverse();
}

function tagsItems(tags: TagsType, tagName?: string) {
  const tag = tags.filter((item) => item.tagName === tagName);
  const data = tag.length > 0 ? tag[0]!.data : null;
  return data;
}

function tagsContainItem(tags: TagsType, tagName?: string) {
  return tagsItems(tags, tagName) !== null;
}

function orderKeys(unorderedObj: Record<string, any>, forDecode: boolean) {
  const orderedObj: Record<string, any> = {};
  Object.keys(unorderedObj)
    .sort()
    .forEach((key) => {
      orderedObj[key] = unorderedObj[key];
    });
  if (forDecode === true) {
    const cacheName = '__tagsObject_cache';
    Object.defineProperty(orderedObj, 'tagsObject', {
      get() {
        if (!this[cacheName]) {
          Object.defineProperty(this, cacheName, {
            value: getTagsObject(this.tags),
          });
        }
        return this[cacheName];
      },
    });
  }
  return orderedObj;
}

function satToHrp(satoshis: number | string) {
  if (!satoshis.toString().match(/^\d+$/)) {
    throw new Error('satoshis must be an integer');
  }
  const millisatoshisBN = BigInt(satoshis);
  return millisatToHrp(Number(millisatoshisBN * BigInt(1000)));
}

function millisatToHrp(millisatoshis: number | string) {
  if (!millisatoshis.toString().match(/^\d+$/)) {
    throw new Error('millisatoshis must be an integer');
  }
  const millisatoshisBN = BigInt(millisatoshis);
  const millisatoshisString = millisatoshisBN.toString(10);
  const millisatoshisLength = millisatoshisString.length;

  let divisorString, valueString;
  if (millisatoshisLength > 11 && /0{11}$/.test(millisatoshisString)) {
    divisorString = '';
    valueString = (millisatoshisBN / MILLISATS_PER_BTC).toString(10);
  } else if (millisatoshisLength > 8 && /0{8}$/.test(millisatoshisString)) {
    divisorString = 'm';
    valueString = (millisatoshisBN / MILLISATS_PER_MILLIBTC).toString(10);
  } else if (millisatoshisLength > 5 && /0{5}$/.test(millisatoshisString)) {
    divisorString = 'u';
    valueString = (millisatoshisBN / MILLISATS_PER_MICROBTC).toString(10);
  } else if (millisatoshisLength > 2 && /0{2}$/.test(millisatoshisString)) {
    divisorString = 'n';
    valueString = (millisatoshisBN / MILLISATS_PER_NANOBTC).toString(10);
  } else {
    divisorString = 'p';
    valueString = (millisatoshisBN * PICOBTC_PER_MILLISATS).toString(10);
  }
  return valueString + divisorString;
}

function hrpToSat(hrpString: string, outputString?: boolean) {
  const millisatoshisBN = hrpToMillisat(hrpString, false);
  if ((millisatoshisBN as bigint) % BigInt(1000) === BigInt(0)) {
    throw new Error('Amount is outside of valid range');
  }
  const result = (millisatoshisBN as bigint) / BigInt(1000);
  return outputString ? result.toString() : result;
}

function hrpToMillisat(hrpString: string, outputString?: boolean) {
  let divisor, value;
  if (hrpString.slice(-1).match(/^[munp]$/)) {
    divisor = hrpString.slice(-1);
    value = hrpString.slice(0, -1);
  } else if (hrpString.slice(-1).match(/^[^munp0-9]$/)) {
    throw new Error('Not a valid multiplier for the amount');
  } else {
    value = hrpString;
  }

  if (!value.match(/^\d+$/)) throw new Error('Not a valid human readable amount');

  const valueBN = BigInt(value);
  const millisatoshisBN = divisor ? (valueBN * MILLISATS_PER_BTC) / DIVISORS[divisor]! : valueBN * MILLISATS_PER_BTC;

  if ((divisor === 'p' && !(valueBN % BigInt(10) === BigInt(0))) || millisatoshisBN > MAX_MILLISATS) {
    throw new Error('Amount is outside of valid range');
  }

  return outputString ? millisatoshisBN.toString() : millisatoshisBN;
}

// decode will only have extra comments that aren't covered in encode comments.
// also if anything is hard to read I'll comment.
function decode(paymentRequest: string, network?: Network): DecodedInvoiceReturns {
  if (typeof paymentRequest !== 'string') throw new Error('Lightning Payment Request must be string');
  if (paymentRequest.slice(0, 2).toLowerCase() !== 'ln') throw new Error('Not a proper lightning payment request');

  const decoded = bech32.decode(paymentRequest, Number.MAX_SAFE_INTEGER);
  paymentRequest = paymentRequest.toLowerCase();
  const prefix = decoded.prefix;
  let words = decoded.words;

  // signature is always 104 words on the end
  // cutting off at the beginning helps since there's no way to tell
  // ahead of time how many tags there are.
  const sigWords = words.slice(-104);
  // grabbing a copy of the words for later, words will be sliced as we parse.
  const wordsNoSig = words.slice(0, -104);
  words = words.slice(0, -104);

  let sigBuffer = wordsToBuffer(sigWords, true);
  const recoveryFlag = sigBuffer.slice(-1)[0];
  sigBuffer = sigBuffer.slice(0, -1);

  if (!(recoveryFlag! in [0, 1, 2, 3]) || sigBuffer.length !== 64) {
    throw new Error('Signature is missing or incorrect');
  }

  // Without reverse lookups, can't say that the multipier at the end must
  // have a number before it, so instead we parse, and if the second group
  // doesn't have anything, there's a good chance the last letter of the
  // coin type got captured by the third group, so just re-regex without
  // the number.
  let prefixMatches = prefix.match(/^ln(\S+?)(\d*)([a-zA-Z]?)$/);
  if (prefixMatches && !prefixMatches[2]) prefixMatches = prefix.match(/^ln(\S+)$/);
  if (!prefixMatches) {
    throw new Error('Not a proper lightning payment request');
  }

  const bech32Prefix = prefixMatches[1];
  let coinNetwork;
  if (!network) {
    switch (bech32Prefix) {
      case DEFAULTNETWORK.bech32:
        coinNetwork = DEFAULTNETWORK;
        break;
      case TESTNETWORK.bech32:
        coinNetwork = TESTNETWORK;
        break;
      case REGTESTNETWORK.bech32:
        coinNetwork = REGTESTNETWORK;
        break;
      case SIMNETWORK.bech32:
        coinNetwork = SIMNETWORK;
        break;
    }
  } else {
    if (
      network.bech32 === undefined ||
      network.pubKeyHash === undefined ||
      network.scriptHash === undefined ||
      !Array.isArray(network.validWitnessVersions)
    )
      throw new Error('Invalid network');
    coinNetwork = network;
  }
  if (!coinNetwork || coinNetwork.bech32 !== bech32Prefix) {
    throw new Error('Unknown coin bech32 prefix');
  }

  const value = prefixMatches[2];
  let satoshis, millisatoshis, removeSatoshis;
  if (value) {
    const divisor = prefixMatches[3];
    try {
      satoshis = parseInt(hrpToSat(value + divisor, true) as string);
    } catch (e) {
      satoshis = null;
      removeSatoshis = true;
    }
    millisatoshis = hrpToMillisat(value + divisor, true) as string;
  } else {
    satoshis = null;
    millisatoshis = null;
  }

  // reminder: left padded 0 bits
  const timestamp = wordsToIntBE(words.slice(0, 7));
  const timestampString = new Date(timestamp * 1000).toISOString();
  words = words.slice(7); // trim off the left 7 words

  const tags = [];
  let tagName, parser, tagLength, tagWords;
  // we have no tag count to go on, so just keep hacking off words
  // until we have none.
  while (words.length > 0) {
    const tagCode = words[0]!.toString();
    tagName = TAGNAMES[tagCode] || unknownTagName;
    parser = TAGPARSERS[tagCode] || getUnknownParser(tagCode);
    words = words.slice(1);

    tagLength = wordsToIntBE(words.slice(0, 2));
    words = words.slice(2);

    tagWords = words.slice(0, tagLength);
    words = words.slice(tagLength);

    // See: parsers for more comments
    tags.push({
      tagName,
      data: parser(tagWords, coinNetwork), // only fallback address needs coinNetwork
    });
  }

  let timeExpireDate, timeExpireDateString;
  // be kind and provide an absolute expiration date.
  // good for logs
  if (tagsContainItem(tags, TAGNAMES['6'])) {
    timeExpireDate = timestamp + Number(tagsItems(tags, TAGNAMES['6']!));
    timeExpireDateString = new Date(timeExpireDate * 1000).toISOString();
  }

  const toSign = Buffer.concat([Buffer.from(prefix, 'utf8'), Buffer.from(convert(wordsNoSig, 5, 8))]);
  const payReqHash = crypto.createHash('sha256').update(toSign).digest();

  const { r, s } = secp.Signature.fromCompact(sigBuffer);
  const signature = new secp.Signature(r, s, recoveryFlag);
  const sigPubkey = signature.recoverPublicKey(payReqHash);

  if (tagsContainItem(tags, TAGNAMES['19']) && tagsItems(tags, TAGNAMES['19']) !== sigPubkey.toHex(true)) {
    throw new Error('Lightning Payment Request signature pubkey does not match payee pubkey');
  }

  let finalResult: PaymentRequestObject = {
    paymentRequest,
    complete: true,
    prefix,
    wordsTemp: bech32.encode('temp', wordsNoSig.concat(sigWords), Number.MAX_SAFE_INTEGER),
    network: coinNetwork,
    satoshis,
    millisatoshis,
    timestamp,
    timestampString,
    payeeNodeKey: sigPubkey.toHex(true),
    signature: sigBuffer.toString('hex'),
    recoveryFlag,
    tags,
  };

  if (removeSatoshis) delete finalResult.satoshis;

  if (timeExpireDate) {
    finalResult = Object.assign(finalResult, { timeExpireDate, timeExpireDateString });
  }

  return orderKeys(finalResult, true) as DecodedInvoiceReturns;
}

function getTagsObject(tags: TagsType) {
  const result: Record<string, any> = {};
  tags.forEach((tag) => {
    if (tag.tagName === unknownTagName) {
      if (!result.unknownTags) {
        result.unknownTags = [];
      }
      result.unknownTags.push(tag.data);
    } else {
      result[tag.tagName] = tag.data;
    }
  });

  return result;
}

export default {
  decode,
  satToHrp,
  millisatToHrp,
  hrpToSat,
  hrpToMillisat,
};
