import { TokenInputProps } from '../../model/token';
import { getTokenSymbolFromMint } from '../../utils/tokens';
import { TokenIcon } from '../ui/icons';
import { useProgramContext } from '../../context/program-context';
import { useEffect, useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { formatTokenAmount } from '../../utils';

export const TokenInput: React.FC<TokenInputProps> = ({
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  label,
}) => {
  const { getBalance, fetchConnection } = useProgramContext();
  const [formattedBalance, setFormattedBalance] = useState<string>('0');

  useEffect(() => {
    if (token) {
      const connection = fetchConnection();
      if (connection) {
        const balance = getBalance(new PublicKey(token));
        setFormattedBalance(
          balance ? formatTokenAmount(balance.toString(), 0) : '0'
        );
      }
    } else {
      setFormattedBalance('0');
    }
  }, [token, getBalance, fetchConnection]);

  return (
    <>
      <div className="p text-ghost shadow-xl flex justify-between">
        <div>{label}</div>
        <div className="text-xs">
          <span className="text-sunset">{formattedBalance}</span> balance
        </div>
      </div>

      <label className="input input-xl flex items-center gap shadow-xl bg-base-300 border-none shadow-base">
        {token && <TokenIcon mint={token} />}
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="grow"
          placeholder="0.0"
        />
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={onTokenSelect}
        >
          {getTokenSymbolFromMint(token) || 'select'}
        </button>
      </label>
    </>
  );
};
