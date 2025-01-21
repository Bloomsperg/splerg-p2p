#!/bin/bash

# Kill any existing validator process
pkill -f solana-test-validator

# Clear any existing ledger
rm -rf test-ledger/

# Start the validator with your program deployed
solana-test-validator \
    --reset \
    --bpf-program $(solana address -k target/deploy/spl_p2p-keypair.json) target/deploy/spl_p2p.so \
    --bind-address 0.0.0.0

echo "Validator started with P2P program deployed!"
echo "Program ID: $(solana address -k target/deploy/spl_p2p-keypair.json)"