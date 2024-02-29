'use client';
// import plugins from '@/config/plugins.json';
import React, { ReactNode, Suspense, useEffect, useState } from 'react';

const MyComponent = () => {
  const [importedComponent, setImportedComponent] = useState<ReactNode | null>(null);

  useEffect(() => {
    const importComponent = async () => {
      const { AppIndex } = await import(`@lawallet/microfront-template`);
      setImportedComponent(<AppIndex />);
    };

    importComponent();
  }, []);

  return <Suspense>{importedComponent}</Suspense>;
};

export default MyComponent;
