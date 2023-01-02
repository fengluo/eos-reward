const { Api, JsonRpc, RpcError } = require('eosjs');
const { SignatureProvider } = require('./sig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');

module.exports = async function reward(config){
  const {chainId, rpcUrl, privateKey, accountName, keyPrefix='EOS'} = config
  const signatureProvider = SignatureProvider([privateKey], keyPrefix);

  const rpc = new JsonRpc(rpcUrl, { fetch });

  const api = new Api({ chainId, rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  try {
    const result = await api.transact({
      actions: [{
        account: 'eosio',
        name: 'claimrewards',
        authorization: [{
          actor: accountName,
          permission: 'active',
        }],
        data: {
          owner:accountName
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });
    console.dir(result);
  } catch (error) {
    console.error('error', error)
  }
}