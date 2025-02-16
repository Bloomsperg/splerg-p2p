// src/features/trades/TradesView.tsx
import { useProgramContext } from '../context/program-context';
import { LoadingState, EmptyState } from '../components/ui/states';
import { OrderTable } from '../components/ui/tables';
import { OrderTableProps } from '../model';
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

export const TradesTable: React.FC<OrderTableProps> = ({ orders = [] }) => {
  const { publicKey } = useWallet();
  const [filteredOrders, setFilteredOrders] = useState(orders);

  useEffect(() => {
    if (publicKey) {
      const filtered = orders.filter(
        (order) =>
          publicKey.toBase58() === order.maker.toBase58() ||
          publicKey.toBase58() === order.taker.toBase58()
      );
      setFilteredOrders(filtered);
    }
  }, [publicKey, orders]);

  return <OrderTable orders={filteredOrders} modalContext="trades" />;
};

export const TradesView = () => {
  const { orders, loading } = useProgramContext();

  if (loading) return <LoadingState />;
  if (!orders?.length) return <EmptyState message="No orders found" />;

  return <TradesTable orders={orders} />;
};
