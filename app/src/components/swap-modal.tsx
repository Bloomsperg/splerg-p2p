import { Order } from '../model';
import { SwapHorizontalIcon, TokenIcon } from './ui/icon';

interface SwapModalProps {
  order: Order;
  index: number;
  formatAmount: (amount: number) => string;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  order,
  index,
  formatAmount,
}) => {
  const handleSwap = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Swapping order:', order);
    (
      document.getElementById(`swap_modal_${index}`) as HTMLDialogElement
    )?.close();
  };

  return (
    <dialog id={`swap_modal_${index}`} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Swap Tokens</h3>
        <div className="py-4">
          <div className="flex items-center justify-between mb-4">
            <TokenPair
              makerMint={order.maker_token_mint}
              takerMint={order.taker_token_mint}
              makerAmount={formatAmount(order.maker_amount)}
              takerAmount={formatAmount(order.taker_amount)}
            />
          </div>
        </div>
        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            <button className="btn">Cancel</button>
            <button className="btn btn-primary" onClick={handleSwap}>
              Confirm
            </button>
          </form>
        </div>
      </div>
    </dialog>
  );
};

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
  <>
    <div className="flex items-center px-2">
      <TokenIcon mint={makerMint} />
      {makerAmount && <span>{makerAmount}</span>}
    </div>
    <div className="flex items-center">
      <SwapHorizontalIcon />
    </div>
    <div className="flex items-center px-2">
      <TokenIcon mint={takerMint} />
      {takerAmount && <span>{takerAmount}</span>}
    </div>
  </>
);
