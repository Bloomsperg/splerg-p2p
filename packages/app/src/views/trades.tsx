// src/features/trades/TradesView.tsx
import { useProgramContext } from '../context/program-context';
import { LoadingState, EmptyState } from '../components/ui/states';
import { OrderTable } from '../components/ui/tables';
import { OrderTableProps } from '../model';
import { mockOrders } from '../utils/orders';

export const TradesTable: React.FC<OrderTableProps> = ({ orders = [] }) => (
  <OrderTable
    orders={orders}
    defaultOrders={mockOrders}
    modalContext="trades"
  />
);

export const TradesView = () => {
  const { orders, loading } = useProgramContext();

  if (loading) return <LoadingState />;
  if (!orders?.length) return <EmptyState message="No orders found" />;

  return <TradesTable orders={orders} />;
};
