type AvailableCurrencies = 'SAT' | 'USD' | 'ARS';
type AmountType = Record<AvailableCurrencies, number>;

interface IUseNumpad {
  usedCurrency: AvailableCurrencies;
  intAmount: AmountType;
  deleteNumber: () => void;
  concatNumber: (strNumber: string) => void;
  handleNumpad: (value: string) => void;
  resetAmount: () => void;
  modifyCurrency: (currency: AvailableCurrencies) => void;
  setCustomAmount: (amount: number, currency: AvailableCurrencies) => void;
  updateNumpadAmount: (new_amount: string) => void;
}

export type KeyboardProps = {
  numpadData: IUseNumpad;
  disableKeydown?: boolean;
};
