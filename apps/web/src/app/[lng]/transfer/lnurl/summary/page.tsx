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
  const { LNURLTransferInfo, isSuccess, isError, execute, isLoading } = useLNURLContext();

  useActionOnKeypress('Enter', execute, [LNURLTransferInfo]);

  return (
    <>
      {isSuccess || isError ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={LNURLTransferInfo} />}
        </>
      ) : (
        <>
          <Navbar
            showBackPage={true}
            title={t('VALIDATE_INFO')}
            overrideBack={
              LNURLTransferInfo.type === TransferTypes.LNURLW
                ? `/transfer`
                : `/transfer/lnurl?data=${LNURLTransferInfo.data}&amount=${LNURLTransferInfo.amount}${LNURLTransferInfo.comment ? `&comment=${LNURLTransferInfo.comment}` : ''}`
            }
          />
          <Summary
            isLoading={isLoading}
            isSuccess={isSuccess}
            data={LNURLTransferInfo.data}
            type={LNURLTransferInfo.type}
            amount={LNURLTransferInfo.amount}
            expired={false}
            onClick={execute}
          />
        </>
      )}
    </>
  );
};

export default page;
