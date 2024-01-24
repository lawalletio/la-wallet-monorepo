'use client';
import Navbar from '@/components/Layout/Navbar';
import { useTranslation } from '@/context/TranslateContext';
import { useInvoice } from '@lawallet/react';
import React from 'react';
import { Summary } from '../../components/Summary';
import { TransferTypes } from '@lawallet/react/types';
import { FinishTransfer } from '../../components/Finish';
import { ErrorTransfer } from '../../components/Error';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';

const TransferWithInvoice = ({ params }) => {
  const { t } = useTranslation();

  const { isLoading, isError, isSuccess, parsedInvoice, execute } = useInvoice({
    bolt11: params.bolt11,
  });

  useActionOnKeypress('Enter', execute, [parsedInvoice]);

  return (
    <>
      {isError || isSuccess ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={parsedInvoice} />}
        </>
      ) : (
        <>
          <Navbar showBackPage={true} title={t('VALIDATE_INFO')} overrideBack="/transfer" />
          <Summary
            isLoading={isLoading}
            data={parsedInvoice.data}
            type={TransferTypes.INVOICE}
            amount={parsedInvoice.amount}
            expired={parsedInvoice.expired}
            onClick={execute}
          />
        </>
      )}
    </>
  );
};

export default TransferWithInvoice;
