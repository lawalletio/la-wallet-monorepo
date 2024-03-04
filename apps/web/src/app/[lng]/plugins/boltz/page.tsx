'use client';
import React, { ReactNode, useEffect, useState } from 'react';

const page = () => {
  const [importedComponent, setImportedComponent] = useState<ReactNode | null>(null);

  useEffect(() => {
    const importComponent = async () => {
      try {
        const { AppIndex } = await import('@lawallet/boltz');
        setImportedComponent(<AppIndex />);
      } catch (error) {
        console.error(`Error al importar el componente dinámico: ${error}`);
      }
    };

    importComponent();
  }, []);

  return importedComponent;
};

export default page;
