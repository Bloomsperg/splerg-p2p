import { formatTokenAmount } from '../../utils';
import { TokenIcon, SwapHorizontalIcon } from '../ui/icons';

interface TokenPairProps {
  makerMint: string;
  takerMint: string;
  makerAmount?: string;
  takerAmount?: string;
}

export const TokenPair: React.FC<TokenPairProps> = ({
  makerMint,
  takerMint,
  makerAmount,
  takerAmount,
}) => (
  <div className="flex items-center justify-start">
    <div className="flex items-center justify-end w-24">
      {makerAmount && (
        <span className="px-1 text-lg tabular-nums text-right">
          {formatTokenAmount(makerAmount)}
        </span>
      )}
      <TokenIcon mint={makerMint} />
    </div>

    <div className="flex items-center px-4">
      <SwapHorizontalIcon />
    </div>

    <div className="flex items-center justify-start w-24">
      {takerAmount && (
        <span className="px-1 text-lg tabular-nums text-left">
          {formatTokenAmount(takerAmount)}
        </span>
      )}
      <TokenIcon mint={takerMint} />
    </div>
  </div>
);
