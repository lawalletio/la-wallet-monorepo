'use client';
import Navbar from '@/components/Layout/Navbar';
import { useTranslation } from '@/context/TranslateContext';
import { useInvoice } from '@lawallet/react';
import React, { useState } from 'react';
import { Summary } from '../../components/Summary';
import { TransferTypes } from '@lawallet/react/types';
import { FinishTransfer } from '../../components/Finish';
import { ErrorTransfer } from '../../components/Error';

const TransferWithInvoice = ({ params }) => {
  const { t } = useTranslation();

  const { isLoading, isError, isSuccess, invoiceInfo, execute } = useInvoice({
    bolt11: params.bolt11,
  });

  return (
    <>
      {isError || isSuccess ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={invoiceInfo} />}
        </>
      ) : (
        <>
          <Navbar showBackPage={true} title={t('VALIDATE_INFO')} />
          <Summary
            isLoading={isLoading}
            data={invoiceInfo.data}
            type={TransferTypes.INVOICE}
            amount={invoiceInfo.amount}
            expired={invoiceInfo.expired}
            onClick={execute}
          />
        </>
      )}
    </>
  );
};

export default TransferWithInvoice;
