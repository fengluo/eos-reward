const cron = require('node-cron');
const {chains} = require('../config');
const accounts = require('../config/accounts.json');
const discover = require('./discover');
const reward = require('./reward');
const {privateToPublic} = require('./utils');


console.log('start time: ', new Date());

async function run() {
	const privateKey = process.env.PRIVATE_KEY;

	for (const chain of chains) {
		const publicKey = privateToPublic(privateKey, chain.keyPrefix);
		const chainAccounts = accounts[chain.name].length !== 0 ? accounts[chain.name].map(account => ({account_name: account})) : await discover(chain.rpcUrl, publicKey);
		for (const account of chainAccounts) {
			await reward(chain.chainId, chain.rpcUrl, privateKey, account.account_name, chain.systemAccount, chain.keyPrefix)
		}
	}
}

run();

cron.schedule('0 */1 * * *', () => {
  console.log('Date', new Date());
  run();
});
