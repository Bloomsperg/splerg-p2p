import { TokenIcon } from './ui/icon';
import { ArrowIcon } from './ui/icon';

export interface TokenPairProps {
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
  <div className="flex items-center gap-2">
    <button className="btn btn-ghost btn-xs btn-circle">
      <TokenIcon mint={makerMint} />
      {makerAmount && <span>{makerAmount}</span>}
    </button>
    <ArrowIcon />
    <button className="btn btn-ghost btn-xs btn-circle">
      <TokenIcon mint={takerMint} />
      {takerAmount && <span>{takerAmount}</span>}
    </button>
  </div>
);
