import { useProgramContext } from '../context/program-context';
import { LoadingState, EmptyState } from '../components/ui/states';
import { OrderTable } from '../components/ui/tables';
import { OrderTableProps, Order } from '../model';
import { MY_WALLET, mockOrders } from '../utils';

export const InboxTable: React.FC<OrderTableProps> = ({ orders = [] }) => {
  const inboxTabs = [
    {
      id: 'myOrders',
      label: 'Active',
      filterFn: (order: Order) =>
        order.taker.toBase58() === MY_WALLET.toBase58(),
    },
    {
      id: 'inbox',
      label: 'Inbox',
      filterFn: (order: Order) =>
        order.maker.toBase58() === MY_WALLET.toBase58(),
    },
  ];

  return (
    <OrderTable
      orders={orders}
      defaultOrders={mockOrders}
      tabs={inboxTabs}
      modalContext=""
    />
  );
};

export const UserView = () => {
  const { userOrders, userLoading } = useProgramContext();

  if (userLoading) return <LoadingState />;
  if (!userOrders?.length) return <EmptyState message="No requests found" />;

  return <InboxTable orders={userOrders} />;
};
