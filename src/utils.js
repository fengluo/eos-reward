const {PrivateKey} = require('eosjs/dist/eosjs-jssig');

function privateToPublic(privateKey, publicKeyPrefix = 'EOS') {
  const priv = PrivateKey.fromString(privateKey);
  const pubStr = priv.getPublicKey().toLegacyString().replace(/^EOS/, publicKeyPrefix);
  return pubStr;
}

module.exports = {
  privateToPublic
}