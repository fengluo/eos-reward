const fs = require('fs');
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const { SignatureProvider } = require('./sig');

module.exports = async function reward(chainId, rpcUrl, privateKey, accountName, systemAccount='eosio', keyPrefix='EOS'){

  if(!fs.existsSync('./result.json')){
    const writeErr = await fs.writeFileSync('./result.json', '[]')
    console.log('writeErr', writeErr)
  }

  const resultBuf = fs.readFileSync('./result.json');

  let result 

  try {
   result = JSON.parse(resultBuf.toString()) 
  } catch (error) {
    console.log('JSON parse error', error);
    result = [{account_name: accountName}]
  }

  let accountRecordIndex = -1;
  let accountRecord = {account_name: accountName};

  result.forEach((item, index)=>{
    if(item.account_name === accountName){
      accountRecord = item;
      accountRecordIndex = index;
    }
  })

  if(accountRecordIndex === -1){
    result.push(accountRecord);
    accountRecordIndex = result.length - 1;
  }

  const now = new Date();

  console.log('now', now, accountName)

  if(accountRecord && now - new Date(accountRecord.last_claim_success_time) < 24 * 60 * 60 * 1000){
    console.log('accountName', accountName, 'already claimed at', accountRecord.last_claim_success_time)
    return
  }

  const signatureProvider = SignatureProvider([privateKey], keyPrefix);

  const rpc = new JsonRpc(rpcUrl, { fetch });

  const api = new Api({ chainId, rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  try {
    const trxResp = await api.transact({
      actions: [{
        account: systemAccount,
        name: 'claimrewards',
        authorization: [{
          actor: accountName,
          permission: 'claim',
        }],
        data: {
          owner:accountName
        },
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    });
    console.dir(trxResp, { depth: null });
    result[accountRecordIndex] = {
      ...accountRecord,
      claim_num: accountRecord?.claim_num ? accountRecord.claim_num + 1 : 1,
      last_claim_time: new Date(),
      last_claim_status: 'success',
      last_claim_success_time: new Date(),
      success_num: accountRecord?.success_num ? accountRecord.success_num + 1 : 1,
      transaction_id: trxResp.transaction_id,
      error_message: '',
    }
  } catch (error) {
    console.error('error', error?.details?.[0]?.message || error);
    result[accountRecordIndex] = {
      ...accountRecord,
      claim_num: accountRecord?.claim_num ? accountRecord.claim_num + 1 : 1,
      last_claim_time: new Date(),
      last_claim_status: 'error',
      last_claim_error_time: new Date(),
      error_num: accountRecord?.error_num ? accountRecord.error_num + 1 : 1,
      error_message: error?.details?.[0]?.message || error,
    }
  }
  const writeErr = fs.writeFileSync('./result.json', JSON.stringify(result, null, 2))
  writeErr && console.log('writeErr', writeErr)
}