const fetch = require('node-fetch');

// find all accounts containing the permission 'claim'
module.exports = async function discover(rpcUrl, publicKey){
  const resp = await fetch(`${rpcUrl}/v1/chain/get_accounts_by_authorizers`,
    {
      method: 'POST',
      body: JSON.stringify({
        accounts: [],
        keys: [publicKey],
      })
    }
  )
  // console.log('resp', await resp.json())
  const {accounts} = await resp.json()
  console.log('accounts', accounts)
  return accounts.filter((account)=> account.permission_name === 'claim')
}
