import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalType, Order } from '../model';
import { CancelIcon } from './ui/icons';
import { TokenPair } from './token/token-pair';
import { useModal } from '../context/modal-context';

interface SwapModalProps {
  order: Order;
  index: number;
  context: string;
}

export const SwapModal: React.FC<SwapModalProps> = ({
  order,
  index,
  context,
}) => {
  const navigate = useNavigate();
  const { openModal, closeModal } = useModal();

  const handleSwap = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    console.log('Swapping order:', order);
    closeModal(`swapDetails-${index}` as ModalType);
  };

  const handleModifyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    closeModal(`swapDetails-${index}` as ModalType);
    navigate(`/modify/${order.id}`);
  };

  const renderContextContent = () => {
    switch (context) {
      case 'trades':
        return (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <TokenPair
                makerMint={order.makerTokenMint.toBase58()}
                takerMint={order.takerTokenMint.toBase58()}
                makerAmount={order.makerAmount.toString()}
                takerAmount={order.takerAmount.toString()}
              />
            </div>
            <div className="text-sm opacity-70">
              <p>Execute this trade to swap tokens at the specified rate.</p>
            </div>
          </div>
        );

      case 'myOrders':
        return (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <TokenPair
                makerMint={order.makerTokenMint.toBase58()}
                takerMint={order.takerTokenMint.toBase58()}
                makerAmount={order.makerAmount.toString()}
                takerAmount={order.takerAmount.toString()}
              />
            </div>
            <div className="text-sm opacity-70">
              <p>Cancel your existing order or modify the terms.</p>
            </div>
            <div className="flex gap-4 mt-8">
              <button className="btn btn-ghost border-red-500 border-2 text-gray-300">
                Cancel
              </button>
              <button
                className="btn btn-ghost border-sunset/90 border-2 text-gray-300"
                onClick={handleModifyClick}
              >
                Modify
              </button>
            </div>
          </div>
        );

      case 'inbox':
        return (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <TokenPair
                makerMint={order.makerTokenMint.toBase58()}
                takerMint={order.takerTokenMint.toBase58()}
                makerAmount={order.makerAmount.toString()}
                takerAmount={order.takerAmount.toString()}
              />
            </div>
            <div className="text-sm opacity-70">
              <p>This order was sent to you. Accept to execute the swap.</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (context) {
      case 'trades':
        return 'Execute Trade';
      case 'myOrders':
        return 'Manage Your Order';
      case 'inbox':
        return 'Accept Swap Offer';
      default:
        return 'Swap Tokens';
    }
  };

  const getActionButton = () => {
    switch (context) {
      case 'trades':
        return (
          <button
            className="btn btn-ghost border-sunset/90 border-2 text-gray-300"
            onClick={handleSwap}
          >
            Execute Trade
          </button>
        );
      case 'myOrders':
        return null;
      case 'inbox':
        return (
          <button
            className="btn btn-ghost border-sunset/90 border-2 text-gray-300"
            onClick={handleSwap}
          >
            Accept
          </button>
        );
      default:
        return (
          <button className="btn btn-primary" onClick={handleSwap}>
            Confirm
          </button>
        );
    }
  };

  return (
    <dialog id={`swap_modal_${index}`} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{getModalTitle()}</h3>
        {renderContextContent()}
        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            <button
              className="btn btn-circle"
              onClick={() => closeModal(`swapDetails-${index}` as ModalType)}
            >
              <CancelIcon />
            </button>
            {getActionButton()}
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={() => closeModal(`swapDetails-${index}` as ModalType)}>
          close
        </button>
      </form>
    </dialog>
  );
};
