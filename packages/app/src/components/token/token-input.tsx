import { TokenInputProps } from '../../model/token';
import { TokenIcon } from '../ui/icons';

export const TokenInput: React.FC<TokenInputProps> = ({
  token,
  amount,
  onAmountChange,
  onTokenSelect,
  label,
  balance = '$0',
}) => (
  <>
    <div className="p text-ghost shadow-xl flex justify-between">
      <div>{label}</div>
      <div className="text-[8px]">
        <span className="text-sunset text-xs">{balance}</span> balance
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
        {token.toBase58() || 'select'}
      </button>
    </label>
  </>
);
