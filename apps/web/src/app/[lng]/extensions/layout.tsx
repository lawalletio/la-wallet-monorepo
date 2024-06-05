import PluginsEmptyView from '@/components/Layout/EmptyView/PluginsEmptyView';
import { pluginsEnabled } from '@/config/exports';
import { APP_NAME } from '@/constants/constants';
import { getTranslations } from 'next-intl/server';
import React from 'react';

export async function generateMetadata({ params: { lng } }) {
  const t = await getTranslations({ locale: lng, namespace: 'metadata' });

  return {
    title: `${t('PLUGINS_TITLE')} - ${APP_NAME}`,
  };
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  if (!pluginsEnabled) return <PluginsEmptyView />;

  return children;
};

export default RootLayout;
