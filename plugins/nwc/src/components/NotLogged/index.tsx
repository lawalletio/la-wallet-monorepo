import { Button, Flex, Input } from '@lawallet/ui';
import React from 'react';

export interface NotLoggedProps {
  login: (nwcUrl: string) => void;
}

const NotLogged = ({ login }: NotLoggedProps) => {
  const [nwcUrl, setNwcUrl] = React.useState<string>(
    '',
    // 'nostr+walletconnect://69effe7b49a6dd5cf525bd0905917a5005ffe480b58eeb8e861418cf3ae760d9?relay=wss://relay.getalby.com/v1&secret=16af9d13018e9d88c1d30c0e6ca89d84712e8cae326143e5ae22e99c63c645a9&lud16=lacrypta@getalby.com',
  );

  return (
    <Flex direction="column" gap={8}>
      <Input
        type="text"
        placeholder="nostr-walletconnect://..."
        value={nwcUrl}
        onChange={(e) => {
          setNwcUrl(e.currentTarget.value);
        }}
      />
      <Flex>
        <Button onClick={() => login(nwcUrl)}>Connect to Node</Button>
      </Flex>
    </Flex>
  );
};

export default NotLogged;