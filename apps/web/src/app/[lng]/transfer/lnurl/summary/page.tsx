'use client';
import { useLNURLContext } from '@/context/LNURLContext';
import React from 'react';
import { Summary } from '../../components/Summary';
import Navbar from '@/components/Layout/Navbar';
import { useTranslation } from '@/context/TranslateContext';
import { ErrorTransfer } from '../../components/Error';
import { FinishTransfer } from '../../components/Finish';
import { TransferTypes } from '@lawallet/react/types';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';

const page = () => {
  const { t } = useTranslation();
  const { transferInfo, isSuccess, isError, execute, isLoading } = useLNURLContext();

  useActionOnKeypress('Enter', execute, [transferInfo]);

  return (
    <>
      {isSuccess || isError ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={transferInfo} />}
        </>
      ) : (
        <>
          <Navbar
            showBackPage={true}
            title={t('VALIDATE_INFO')}
            overrideBack={
              transferInfo.type === TransferTypes.LNURLW
                ? `/transfer`
                : `/transfer/lnurl?data=${transferInfo.data}&amount=${transferInfo.amount}${transferInfo.comment ? `&comment=${transferInfo.comment}` : ''}`
            }
          />
          <Summary
            isLoading={isLoading}
            data={transferInfo.data}
            type={transferInfo.type}
            amount={transferInfo.amount}
            expired={transferInfo.expired}
            onClick={execute}
          />
        </>
      )}
    </>
  );
};

export default page;
