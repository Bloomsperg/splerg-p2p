import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { Order } from '../model';
import {
  getAccount,
  getAssociatedTokenAddress,
  Account,
} from '@solana/spl-token';
import { TOKENS } from '../utils/tokens';
import { fetchProgramAccounts } from '../utils/orders';

interface ProgramState {
  conn: Connection | null;
  orders: Order[];
  userOrders: Order[];
  loading: boolean;
  userLoading: boolean;
  connected: boolean;
  tokenBalances: Record<string, number>;
}

interface ProgramMutations {
  fetchOrders: (owner?: PublicKey) => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  removeOrder: (orderId: PublicKey) => void;
  updateOrder: (orderId: PublicKey, updates: Partial<Order>) => void;
  fetchTokenBalances: () => Promise<void>;
  getBalance: (mint: PublicKey) => number | undefined;
  fetchConnection: () => Connection | null;
}

interface ProgramContextType extends ProgramState, ProgramMutations {}

const ProgramContext = createContext<ProgramContextType | undefined>(undefined);

const initialState: ProgramState = {
  conn: null,
  orders: [],
  userOrders: [],
  loading: false,
  userLoading: false,
  connected: false,
  tokenBalances: {},
};

export const ProgramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [state, setState] = useState<ProgramState>(initialState);

  const fetchConnection = useCallback((): Connection => {
    if (connection) {
      return connection;
    }

    const endpoint = import.meta.env.VITE_SOLANA_RPC_ENDPOINT;
    if (!state.conn) {
      const newConnection = new Connection(endpoint);
      setState((prev) => ({ ...prev, conn: newConnection }));
      return newConnection;
    }

    return state.conn;
  }, [connection, state.conn]);

  const fetchOrders = useCallback(
    async (owner?: PublicKey) => {
      if (!state.conn) return;
      try {
        setState((prev) => ({
          ...prev,
          [owner ? 'userLoading' : 'loading']: true,
        }));

        const orders = await fetchProgramAccounts(state.conn, owner);

        setState((prev) => ({
          ...prev,
          [owner ? 'userOrders' : 'orders']: orders,
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
    [state.conn]
  );

  const addOrder = useCallback(
    async (order: Order) => {
      try {
        setState((prev) => ({
          ...prev,
          userOrders: [...prev.userOrders, order],
        }));
      } catch (error) {
        console.error('Failed to add order:', error);
      }
    },
    [publicKey]
  );

  const fetchTokenBalances = useCallback(async () => {
    if (!publicKey) return;

    const conn = state.conn || connection;
    if (!conn) return;

    try {
      const balances: Record<string, number> = {};

      await Promise.all(
        TOKENS.map(async (token) => {
          try {
            const ata = await getAssociatedTokenAddress(token.mint, publicKey);
            let account: Account;

            try {
              account = await getAccount(conn, ata);
            } catch {
              balances[token.mint.toString()] = 0;
              return;
            }

            const balance =
              Number(account.amount) / Math.pow(10, token.decimals!);
            balances[token.mint.toString()] = balance;
          } catch (e) {
            console.error(`Error fetching balance for ${token.symbol}:`, e);
            balances[token.mint.toString()] = 0;
          }
        })
      );

      setState((prev) => ({
        ...prev,
        tokenBalances: balances,
      }));
    } catch (error) {
      console.error('Failed to fetch token balances:', error);
    }
  }, [fetchConnection, publicKey]);

  const getBalance = useCallback(
    (mint: PublicKey): number | undefined => {
      return state.tokenBalances[mint.toString()];
    },
    [state.tokenBalances]
  );

  const removeOrder = useCallback((orderId: PublicKey) => {
    setState((prev) => ({
      ...prev,
      orders: prev.orders.filter((order) => !order.address.equals(orderId)),
      userOrders: prev.userOrders.filter((order) => !order.address.equals(orderId)),
    }));
  }, []);

  const updateOrder = useCallback(
    (orderId: PublicKey, updates: Partial<Order>) => {
      setState((prev) => {
        const updateOrderInList = (orderList: Order[]) =>
          orderList.map((order) =>
            order.address.equals(orderId) ? { ...order, ...updates } : order
          );

        return {
          ...prev,
          orders: updateOrderInList(prev.orders),
          userOrders: updateOrderInList(prev.userOrders),
        };
      });
    },
    []
  );

  useEffect(() => {
    const conn = fetchConnection();
    setState((prev) => ({ ...prev, conn }));
  }, []);

  useEffect(() => {
    if (state.conn) {
      fetchOrders();
    }
  }, [state.conn]);

  useEffect(() => {
    if (state.conn && publicKey) {
      fetchOrders(publicKey);
      fetchTokenBalances();
    }
  }, [publicKey, state.conn]);

  const contextValue: ProgramContextType = {
    ...state,
    fetchOrders,
    addOrder,
    removeOrder,
    updateOrder,
    fetchTokenBalances,
    getBalance,
    fetchConnection,
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
