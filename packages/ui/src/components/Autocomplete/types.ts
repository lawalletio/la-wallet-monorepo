import { InputProps } from '../Input/types';

export interface AutocompleteProps extends InputProps {
  data: any;
  visible: boolean;
  onSelect: (value: any) => void;
}

export interface AutocompletePrimitiveProps {
  $background?: string;
  $color?: string;
  $isOpen: boolean;
}
