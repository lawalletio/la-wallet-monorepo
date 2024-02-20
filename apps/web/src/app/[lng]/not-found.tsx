'use client';
import SpinnerView from '@/components/Spinner/SpinnerView';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

const notFound = () => {
  const router = useRouter();

  useEffect(() => {
    router.push('/');
  }, []);

  return <SpinnerView loadingText={'Not found page'} />;
};

export default notFound;
