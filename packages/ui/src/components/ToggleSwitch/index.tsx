import React, { useEffect, useState } from 'react';

import { ToggleSwitchProps } from './types';
import { ToggleSwitchPrimitive } from './style';
import { Text } from '../Text';

export function ToggleSwitch(props: ToggleSwitchProps) {
  const { label, onChange, id, switchEnabled = false } = props;

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
      {label ? <Text>{label}</Text> : null}
      <input onChange={() => null} checked={active} id={id} type="checkbox" />
      <label htmlFor={id} onClick={handleChange}>
        Toggle
      </label>
    </ToggleSwitchPrimitive>
  );
}
