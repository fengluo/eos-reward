# EOS Reward
This tool is used to claim rewards of EOS block producer.

## Installation and use

### Option 1: for nodejs

```
npm install
CHAIN_ID="chain_id_value" RPC_URL="rpc_url_value" PRIVATE_KEY="private_key_value" ACCOUNT_NAME="account_name_value" npm run start
```

### Option 2: for docker
```
docker build -t eos-reward:1.0 .
docker run -e CHAIN_ID="chain_id_value" -e RPC_URL="rpc_url_value" -e PRIVATE_KEY="private_key_value" -e ACCOUNT_NAME="account_name_value" --name=eos-reward eos-reward:1.0
```