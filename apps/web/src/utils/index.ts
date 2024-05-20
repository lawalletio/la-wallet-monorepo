import { STORAGE_IDENTITY_KEY } from '@/constants/constants';
import { BaseStorage } from '@lawallet/react';

export function checkIOS(navigator: Navigator) {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return true;
  } else {
    return Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.userAgent));
  }
}

export function parseContent(content: string) {
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch {
    return {};
  }
}

export const formatBigNumber = (number: number | string) => {
  return Number(number).toLocaleString('es-ES');
};

export const extractFirstTwoChars = (str: string): string => {
  try {
    return str.substring(0, 2).toUpperCase();
  } catch {
    return '--';
  }
};

export const getUserStoragedKey = async (storage: BaseStorage) => {
  const storagedKey = await storage.getItem(STORAGE_IDENTITY_KEY);
  if (!storagedKey) return '';

  const { privateKey } = parseContent(storagedKey);
  return privateKey ?? '';
};
