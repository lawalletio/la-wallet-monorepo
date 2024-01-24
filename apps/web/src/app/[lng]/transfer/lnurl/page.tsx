'use client';
import React, { useEffect } from 'react';
import { SelectTransferAmount } from '../components/SelectAmount';
import Navbar from '@/components/Layout/Navbar';
import { useLNURLContext } from '@/context/LNURLContext';
import { TransferTypes } from '@lawallet/react/types';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/TranslateContext';

const TransferWithLNURL = () => {
  const { t } = useTranslation();
  const { LNURLInfo, setAmountToPay, setComment } = useLNURLContext();
  const router = useRouter();

  useEffect(() => {
    if (LNURLInfo.type === TransferTypes.LNURLW && LNURLInfo.data && LNURLInfo.amount)
      router.push(`/transfer/lnurl/summary?data=${LNURLInfo.data}&amount=${LNURLInfo.amount}`);
  }, [LNURLInfo.amount]);

  return (
    <>
      <Navbar showBackPage={true} title={t('DEFINE_AMOUNT')} overrideBack={`/transfer`} />

      <SelectTransferAmount transferInfo={LNURLInfo} setAmountToPay={setAmountToPay} setComment={setComment} />
    </>
  );
};

export default TransferWithLNURL;
