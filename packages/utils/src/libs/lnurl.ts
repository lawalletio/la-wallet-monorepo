import { bech32 } from '@scure/base';

const rules = {
  prefix: 'lnurl',
  limit: 1023,
};

export const lnurl_decode = (encoded: string) => {
  try {
    if (typeof encoded !== 'string') {
      throw new Error('Invalid argument ("encoded"): String expected');
    }

    const decoded = bech32.decode(encoded, rules.limit);
    return Buffer.from(bech32.fromWords(decoded.words)).toString('utf8');
  } catch {
    return '';
  }
};

export const lnurl_encode = (unencoded: string) => {
  try {
    if (typeof unencoded !== 'string') {
      throw new Error('Invalid argument ("encoded"): String expected');
    }

    const words = bech32.toWords(Buffer.from(unencoded, 'utf8'));
    return bech32.encode(rules.prefix, words, rules.limit);
  } catch {
    return '';
  }
};
