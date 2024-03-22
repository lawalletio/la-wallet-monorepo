'use client';
import { useLNURLContext } from '@/context/LNURLContext';
import { useTranslation } from '@/context/TranslateContext';
import { useActionOnKeypress } from '@/hooks/useActionOnKeypress';
import { TransferTypes } from '@lawallet/react/types';
import { ErrorTransfer } from '../../components/Error';
import { FinishTransfer } from '../../components/Finish';
import { Summary } from '../../components/Summary';
import { Navbar } from '@lawallet/ui';
import BackButton from '@/components/BackButton';

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
            title={t('VALIDATE_INFO')}
            leftButton={
              <BackButton
                overrideBack={
                  LNURLTransferInfo.type === TransferTypes.LNURLW
                    ? `/transfer`
                    : `/transfer/lnurl?data=${LNURLTransferInfo.data}&amount=${LNURLTransferInfo.amount}${LNURLTransferInfo.comment ? `&comment=${LNURLTransferInfo.comment}` : ''}`
                }
              />
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
