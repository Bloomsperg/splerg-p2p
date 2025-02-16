import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { TokenIcon } from '../components/ui/icons';
import { TokenPair } from '../components/token/token-pair';
import { formatPubkey } from '../utils';
import { PublicKey } from '@solana/web3.js';
import { useProgramContext } from '../context/program-context';
import { ActionButtons } from '../components/action-buttons';

export const ModifyView: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { userOrders = [], orders = [] } = useProgramContext();

  const order = [...userOrders, ...orders].find(
    (o) => o.id.toBase58() === orderId
  );

  const [newTakerPubkey, setNewTakerPubkey] = useState('');
  const [newMakerAmount, setNewMakerAmount] = useState(0.0);
  const [newTakerAmount, setNewTakerAmount] = useState(0.0);

  useEffect(() => {
    if (order) {
      if (order.taker.toBase58() !== PublicKey.default.toBase58()) {
        setNewTakerPubkey(formatPubkey(order.taker.toString()));
      }
    }
  }, [order]);

  if (!order) {
    return <Navigate to="/requests" replace />;
  }

  return (
    <div className="w-full px-0 py-0">
      <div className="py-12 px-4 space-y-6 max-w-lg mx-auto md:bg-base-300 rounded-2xl">
        {/* Current Swap */}
        <div>
          <h4 className="text text-sunset/95 mb-2">Current Swap</h4>
          <div className="bg-base-200 p-4 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <TokenPair
                makerMint={order.makerToken}
                takerMint={order.takerToken}
                makerAmount={order.makerAmount.toString()}
                takerAmount={order.takerAmount.toString()}
              />
            </div>
            <div className="text-xs opacity-70">
              <div className="flex justify-between items-start pb-1">
                <span>
                  Recipient:{' '}
                  {order.taker.toBase58() == PublicKey.default.toBase58()
                    ? 'public'
                    : formatPubkey(order.taker.toString())}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modified Order */}
        <div>
          <h4 className="text text-sunset/95 mb-2">Update</h4>
          <div className="card-body flex-1 justify-evenly rounded-lg px-4 py-1">
            {/* Deposit Input */}
            <div>
              <div className="p text-ghost flex justify-between">
                <div>Deposit</div>
              </div>

              <label className="input input-xl w-full flex items-center gap shadow-xl bg-base-300 border-none shadow-base">
                <TokenIcon mint={order.makerToken} />
                <input
                  type="number"
                  value={newMakerAmount}
                  onChange={(e) => setNewMakerAmount(Number(e.target.value))}
                  className="grow"
                  placeholder="0.0"
                />
              </label>
            </div>

            {/* Receive Input */}
            <div className="mt-4">
              <div className="p text-ghost flex justify-between">
                <div>Receive</div>
              </div>

              <label className="input input-xl w-full flex items-center gap shadow-xl bg-base-300 border-none shadow-base">
                <TokenIcon mint={order.takerToken} />
                <input
                  type="number"
                  value={newTakerAmount}
                  onChange={(e) => setNewTakerAmount(Number(e.target.value))}
                  className="grow"
                  placeholder="0.0"
                />
              </label>
            </div>

            {/* Recipient Input */}
            <div className="mt-4">
              <div className="p text-ghost flex justify-between">
                <div>Recipient</div>
              </div>

              <label className="input input-xl w-full flex items-center gap shadow-xl bg-base-300 border-none shadow-base">
                <input
                  type="text"
                  placeholder="new recipient"
                  value={newTakerPubkey}
                  onChange={(e) => setNewTakerPubkey(e.target.value)}
                  className="grow"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full px-4">
          <ActionButtons
            context="modify"
            order={order}
            newMakerAmount={newMakerAmount}
            newTakerAmount={newTakerAmount}
            newTakerPubkey={newTakerPubkey}
          />{' '}
        </div>
      </div>
    </div>
  );
};

export default ModifyView;
