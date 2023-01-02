const secret = require('./secret')

module.exports = {
  chainId: process.env.CHAIN_ID,
  rpcUrl: process.env.RPC_URL,
  privateKey: secret.read('PRIVATE_KEY') || process.env.PRIVATE_KEY,
  accountName: process.env.ACCOUNT_NAME,
  keyPrefix: process.env.KEY_PREFIX || 'EOS'
}