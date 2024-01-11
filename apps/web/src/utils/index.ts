export function checkIOS(navigator: Navigator) {
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    return true;
  } else {
    return Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.userAgent));
  }
}

export function addQueryParameter(url: string, parameter: string) {
  if (url.indexOf('?') === -1) {
    return url + '?' + parameter;
  } else {
    return url + '&' + parameter;
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

export function escapingBrackets(text: string) {
  return text.replace(/\[/g, '\\[\\').replace(/]/g, '\\]\\');
}

export function unescapingText(text: string) {
  return text.replace(/\\/g, '');
}

export function extractEscappedMessage(text: string) {
  const regex = /(?<!\\)\[([^\]]+)]/g;
  const fragments = text.split(regex);

  const escappedMessage = fragments.filter((_, index) => index % 2 === 0).join('');

  return escappedMessage;
}
