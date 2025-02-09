import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Order } from '../model';
import { mockOrders } from '../utils';

interface ProgramState {
  orders: Order[];
  userOrders: Order[];
  loading: boolean;
  userLoading: boolean;
  connected: boolean;
}

interface ProgramMutations {
  fetchOrders: (owner?: PublicKey) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
}

interface ProgramContextType extends ProgramState, ProgramMutations {}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

const initialState: ProgramState = {
  orders: [],
  userOrders: [],
  loading: false,
  userLoading: false,
  connected: false,
};

export const ProgramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [state, setState] = useState<ProgramState>(initialState);

  const fetchOrders = useCallback(
    async (owner?: PublicKey) => {
      try {
        setState((prev) => ({
          ...prev,
          [owner ? 'userLoading' : 'loading']: true,
        }));

        const mappedOrders = mockOrders;

        setState((prev) => ({
          ...prev,
          [owner ? 'userOrders' : 'orders']: mappedOrders,
          [owner ? 'userLoading' : 'loading']: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          [owner ? 'userLoading' : 'loading']: false,
        }));
        console.error('Failed to fetch orders:', error);
      }
    },
    [connection]
  );

  const addOrder = useCallback(
    async (order: Order) => {
      try {
        setState((prev) => ({
          ...prev,
          orders: [...prev.orders, order],
          userOrders: order.maker.equals(publicKey!)
            ? [...prev.userOrders, order]
            : prev.userOrders,
        }));
      } catch (error) {
        console.error('Failed to add order:', error);
      }
    },
    [publicKey]
  );

  useEffect(() => {
    if (connection) {
      fetchOrders();
    }
  }, [connection, fetchOrders]);

  useEffect(() => {
    if (connection && publicKey) {
      fetchOrders(publicKey);
    }
  }, [connection, publicKey, fetchOrders]);

  // Update connected state
  useEffect(() => {
    setState((prev) => ({ ...prev, connected }));
  }, [connected]);

  const contextValue: ProgramContextType = {
    ...state,
    fetchOrders,
    addOrder,
  };

  return (
    <ProgramContext.Provider value={contextValue}>
      {children}
    </ProgramContext.Provider>
  );
};

export const useProgramContext = (): ProgramContextType => {
  const context = useContext(ProgramContext);
  if (context === undefined) {
    throw new Error('useProgramContext must be used within a ProgramProvider');
  }
  return context;
};
