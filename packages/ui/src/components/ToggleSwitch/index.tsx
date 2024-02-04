import React, { useEffect, useState } from 'react';

import { ToggleSwitchProps } from './types';
import { ToggleSwitchPrimitive } from './style';

export function ToggleSwitch(props: ToggleSwitchProps) {
  const { onChange, id, switchEnabled = false } = props;

  const [active, setActive] = useState(switchEnabled);

  const handleChange = () => {
    setActive(!active);
    onChange(!active);
  };

  useEffect(() => {
    if (switchEnabled !== active) setActive(switchEnabled);
  }, [switchEnabled]);

  return (
    <ToggleSwitchPrimitive>
      <input type="checkbox" id={id} checked={active} onChange={handleChange} />
      <label htmlFor={id}>Toggle</label>
    </ToggleSwitchPrimitive>
  );
}
