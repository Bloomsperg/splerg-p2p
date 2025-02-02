import React from 'react';
import { SwapModal, TokenPair } from './swap-modal';
import { OrderTableProps } from '../model';
import { placeholderOrders, formatAmount, handleOpenModal } from '../utils';
import { TableHeader } from './ui/table';
import { AddIcon } from './ui/icon';

export const Inbox: React.FC<OrderTableProps> = ({ orders = [] }) => {
  const displayedOrders = orders.length > 0 ? orders : placeholderOrders;

  return (
    <>
      <div className="overflow-x-auto w-full">
        <table className="table w-full table-zebra">
          <TableHeader />
          <tbody>
            {displayedOrders.map((order, index) => (
              <tr key={`row-${index}`} className="hover:bg-base-100">
                <td className="px-4 py-2 text-left flex">
                  <TokenPair
                    makerMint={order.maker_token_mint}
                    takerMint={order.taker_token_mint}
                    makerAmount=""
                    takerAmount=""
                  />
                </td>
                <td className="px-4 py-2">
                  {formatAmount(order.maker_amount)}
                </td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-circle justify-center"
                    onClick={() => handleOpenModal(index)}
                  >
                    <AddIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {displayedOrders.map((order, index) => (
        <SwapModal
          key={`modal-${index}`}
          order={order}
          index={index}
          formatAmount={formatAmount}
        />
      ))}
    </>
  );
};
