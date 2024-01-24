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
  const { LNURLInfo, isSuccess, isError, execute, isLoading } = useLNURLContext();

  useActionOnKeypress('Enter', execute, [LNURLInfo]);

  return (
    <>
      {isSuccess || isError ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={LNURLInfo} />}
        </>
      ) : (
        <>
          <Navbar
            showBackPage={true}
            title={t('VALIDATE_INFO')}
            overrideBack={
              LNURLInfo.type === TransferTypes.LNURLW
                ? `/transfer`
                : `/transfer/lnurl?data=${LNURLInfo.data}&amount=${LNURLInfo.amount}${LNURLInfo.comment ? `&comment=${LNURLInfo.comment}` : ''}`
            }
          />
          <Summary
            isLoading={isLoading}
            isSuccess={isSuccess}
            data={LNURLInfo.data}
            type={LNURLInfo.type}
            amount={LNURLInfo.amount}
            expired={false}
            onClick={execute}
          />
        </>
      )}
    </>
  );
};

export default page;
