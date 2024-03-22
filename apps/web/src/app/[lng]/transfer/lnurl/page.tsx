'use client';
import React, { useEffect } from 'react';
import { SelectTransferAmount } from '../components/SelectAmount';
import { useLNURLContext } from '@/context/LNURLContext';
import { TransferTypes } from '@lawallet/react/types';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/context/TranslateContext';
import { Navbar } from '@lawallet/ui';
import BackButton from '@/components/BackButton';

const TransferWithLNURL = () => {
  const { t } = useTranslation();
  const { LNURLTransferInfo, setAmountToPay, setComment } = useLNURLContext();
  const router = useRouter();

  useEffect(() => {
    if (LNURLTransferInfo.type === TransferTypes.LNURLW && LNURLTransferInfo.data && LNURLTransferInfo.amount)
      router.push(`/transfer/lnurl/summary?data=${LNURLTransferInfo.data}&amount=${LNURLTransferInfo.amount}`);
  }, [LNURLTransferInfo.amount]);

  return (
    <>
      <Navbar title={t('DEFINE_AMOUNT')} leftButton={<BackButton overrideBack="/transfer" />} />

      <SelectTransferAmount transferInfo={LNURLTransferInfo} setAmountToPay={setAmountToPay} setComment={setComment} />
    </>
  );
};

export default TransferWithLNURL;
