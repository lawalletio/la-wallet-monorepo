'use client';
import { useTranslation } from '@/context/TranslateContext';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';
import { useConfig, useInvoice, useTransfer } from '@lawallet/react';
import { TransferTypes } from '@lawallet/react/types';
import { ErrorTransfer } from '../../components/Error';
import { FinishTransfer } from '../../components/Finish';
import { Summary } from '../../components/Summary';
import { Navbar } from '@lawallet/ui';
import BackButton from '@/components/BackButton';

const TransferWithInvoice = ({ params }) => {
  const { t } = useTranslation();
  const config = useConfig();

  const { txInfo } = useInvoice({
    bolt11: params.bolt11,
    config,
  });

  const { isLoading, isError, isSuccess, execOutboundTransfer } = useTransfer({ ...params, tokenName: 'BTC' });

  const executePayment = async () => {
    if (!txInfo.data || txInfo.type !== TransferTypes.INVOICE || txInfo.expired) return false;
    return execOutboundTransfer({ tags: [['bolt11', txInfo.data]], amount: txInfo.amount });
  };

  useActionOnKeypress('Enter', executePayment, [txInfo]);

  return (
    <>
      {isError || isSuccess ? (
        <>
          <Navbar />

          {isError ? <ErrorTransfer /> : <FinishTransfer transferInfo={txInfo} />}
        </>
      ) : (
        <>
          <Navbar leftButton={<BackButton overrideBack="/transfer" />} title={t('VALIDATE_INFO')} />
          <Summary
            isLoading={isLoading}
            isSuccess={isSuccess}
            data={txInfo.data}
            type={TransferTypes.INVOICE}
            amount={txInfo.amount}
            expired={txInfo.expired}
            onClick={executePayment}
          />
        </>
      )}
    </>
  );
};

export default TransferWithInvoice;
