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
  const { publicKey, connected } = useWallet();
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

  const fetchOrders = useCallback(async (owner?: PublicKey) => {
    try {
      setState((prev) => ({
        ...prev,
        [owner ? 'userLoading' : 'loading']: true,
      }));

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
  }, []);

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

  useEffect(() => {
    const conn = fetchConnection();
    if (conn) {
      fetchOrders();
    }
  }, [fetchConnection, fetchOrders]);

  useEffect(() => {
    const conn = fetchConnection();
    if (conn && publicKey) {
      fetchOrders(publicKey);
    }
  }, [fetchConnection, publicKey, fetchOrders]);

  useEffect(() => {
    const conn = fetchConnection();
    if (conn && publicKey) {
      fetchTokenBalances();
    }
  }, [fetchConnection, publicKey, fetchTokenBalances]);

  // Update connected state
  useEffect(() => {
    setState((prev) => ({ ...prev, connected }));
  }, [connected]);

  const contextValue: ProgramContextType = {
    ...state,
    fetchOrders,
    addOrder,
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
