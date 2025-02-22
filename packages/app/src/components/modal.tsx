import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModalType, Order } from '../model';
import { CancelIcon } from './ui/icons';
import { TokenPair } from './token/token-pair';
import { useModal } from '../context/modal-context';
import { Button } from './ui/buttons';
import { ActionButtons } from './action-buttons';

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
  const { closeModal } = useModal();

  const handleModifyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    closeModal(`swap_modal_${index}` as ModalType);
    navigate(`/modify/${order.address}`);
  };

  const renderContextContent = () => {
    switch (context) {
      case 'trades':
        return (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <TokenPair
                makerMint={order.makerToken}
                takerMint={order.takerToken}
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
                makerMint={order.makerToken}
                takerMint={order.takerToken}
                makerAmount={order.makerAmount.toString()}
                takerAmount={order.takerAmount.toString()}
              />
            </div>
            <div className="text-sm opacity-70">
              <p>Cancel your existing order or modify the terms.</p>
            </div>
            <div className="flex gap-4 mt-8">
              <ActionButtons context="cancel" order={order} />
              <Button
                className="btn-ghost border-sunset/90 border-2 text-gray-300"
                onClick={handleModifyClick}
              >
                Modify
              </Button>
            </div>
          </div>
        );

      case 'inbox':
        return (
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <TokenPair
                makerMint={order.makerToken}
                takerMint={order.takerToken}
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

  return (
    <dialog id={`swap_modal_${index}`} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg">{getModalTitle()}</h3>
        {renderContextContent()}
        <div className="modal-action">
          <form method="dialog" className="flex gap-2">
            <Button
              className="btn-circle"
              onClick={() => closeModal(`swap_modal_${index}` as ModalType)}
            >
              <CancelIcon />
            </Button>
            <ActionButtons context={context} order={order} />
          </form>
        </div>
      </div>
    </dialog>
  );
};
