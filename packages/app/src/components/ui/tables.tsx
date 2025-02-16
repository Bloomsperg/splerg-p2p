import React, { useState } from 'react';
import { Order, OrderTableProps } from '../../model';
import { AddIcon } from './icons';
import { TokenPair } from '../token/token-pair';
import { SwapModal } from '../modal';

export const TableHeader: React.FC = () => <thead></thead>;

interface TabConfig {
  id: string;
  label: string;
  filterFn: (order: Order) => boolean;
}

interface OrderTableComponentProps extends OrderTableProps {
  defaultOrders?: Order[];
  tabs?: TabConfig[];
  modalContext: string;
  className?: string;
}

export const OrderTable: React.FC<OrderTableComponentProps> = ({
  orders = [],
  defaultOrders = [],
  tabs,
  modalContext,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState(tabs?.[0]?.id || '');
  const displayedOrders = orders.length > 0 ? orders : defaultOrders;

  const handleOpenModal = (index: number): void => {
    const modal = document.getElementById(`swap_modal_${index}`);
    if (modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  const filteredOrders =
    tabs && activeTab
      ? displayedOrders.filter(
          tabs.find((tab) => tab.id === activeTab)?.filterFn || (() => true)
        )
      : displayedOrders;

  return (
    <div className={`w-full ${className} max-w-3xl mx-auto md:pt-40`}>
      {/* Render tabs if provided */}
      {tabs && (
        <div className="w-full bg-base-200">
          <div role="tablist" className="tabs w-full flex justify-evenly">
            {tabs.map((tab) => (
              <a
                key={tab.id}
                role="tab"
                className={`tab min-w-28 text-lg ${
                  activeTab === tab.id ? 'tab-active text-sunset' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="table w-full table-zebra md:bg-base-300">
          <TableHeader />
          <tbody>
            {filteredOrders.map((order, index) => (
              <tr key={`row-${index}`} className="hover:bg-base-300">
                <td className="px-4 py-4 text-left flex">
                  <TokenPair
                    makerMint={order.makerToken}
                    takerMint={order.takerToken}
                    makerAmount={order.makerAmount.toString()}
                    takerAmount={order.takerAmount.toString()}
                  />
                </td>
                <td className="pr-4 py-2 text-center">
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

      {/* Modals */}
      {filteredOrders.map((order, index) => (
        <SwapModal
          key={`modal-${index}`}
          order={order}
          index={index}
          context={tabs ? activeTab : modalContext}
        />
      ))}
    </div>
  );
};
