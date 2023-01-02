const {ec} = require('elliptic');

const {
  PrivateKey,
  PublicKey,
  digestFromSerializedData } = require('eosjs/dist/eosjs-jssig'); 
const {convertLegacyPublicKey} = require('eosjs/dist/eosjs-numeric')

const defaultEc = new ec('secp256k1');

function SignatureProvider(privateKeys, keyPrefix='EOS'){

  /** map public to private keys */
  const keys = new Map();

  /** public keys */
  const availableKeys = [];

  for (const k of privateKeys) {
    const priv = PrivateKey.fromString(k);
    const privElliptic = priv.toElliptic();
    const pubStr = priv.getPublicKey().toString();
    keys.set(pubStr, privElliptic);
    availableKeys.push(pubStr);
}

  const getAvailableKeys = async () => {
    return availableKeys;
  }

  const sign = (signatureProviderArgs) =>{
    const { chainId, requiredKeys, serializedTransaction, serializedContextFreeData } = signatureProviderArgs;
    const digest = digestFromSerializedData( chainId, serializedTransaction, serializedContextFreeData, defaultEc);

        const signatures = [];
        for (const requiredKey of requiredKeys) {
            let key = requiredKey
            if(requiredKey.startsWith(keyPrefix)){
              key = requiredKey.replace(keyPrefix,'EOS')
            }
            const publicKey = PublicKey.fromString(key);
            const ellipticPrivateKey = keys.get(convertLegacyPublicKey(key));
            const privateKey = PrivateKey.fromElliptic(ellipticPrivateKey, publicKey.getType());
            const signature = privateKey.sign(digest, false);
            signatures.push(signature.toString());
        }

        return { signatures, serializedTransaction, serializedContextFreeData };
  }

  return {
    getAvailableKeys,
    sign
  }
}

module.exports = {
  SignatureProvider
}