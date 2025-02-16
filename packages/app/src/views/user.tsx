import { useProgramContext } from '../context/program-context';
import { LoadingState, EmptyState } from '../components/ui/states';
import { OrderTable } from '../components/ui/tables';
import { OrderTableProps, Order } from '../model';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const InboxTable: React.FC<OrderTableProps> = ({ orders = [] }) => {
  const { publicKey } = useWallet();

  if (!publicKey) return <WalletMultiButton />;

  const inboxTabs = [
    {
      id: 'myOrders',
      label: 'Active',
      filterFn: (order: Order) =>
        order.maker.toBase58() === publicKey.toBase58(),
    },
    {
      id: 'inbox',
      label: 'Inbox',
      filterFn: (order: Order) =>
        order.taker.toBase58() === publicKey.toBase58(),
    },
  ];

  return <OrderTable orders={orders} tabs={inboxTabs} modalContext="" />;
};

export const UserView = () => {
  const { userOrders, userLoading } = useProgramContext();

  if (userLoading) return <LoadingState />;
  if (!userOrders?.length) return <EmptyState message="No requests found" />;

  return <InboxTable orders={userOrders} />;
};
