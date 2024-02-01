import React, { useState } from 'react';

import { ToggleSwitchProps } from './types';
import { ToggleSwitchPrimitive } from './style';

export function ToggleSwitch(props: ToggleSwitchProps) {
  const { onChange, id } = props;

  const [active, setActive] = useState(false);

  const handleChange = () => {
    setActive(!active);
    onChange(!active);
  };

  return (
    <ToggleSwitchPrimitive>
      <input type="checkbox" id={id} />
      <label htmlFor={id} onClick={handleChange}>
        Toggle
      </label>
    </ToggleSwitchPrimitive>
  );
}
