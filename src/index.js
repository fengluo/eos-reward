const cron = require('node-cron');
const {chains} = require('../config');
const discover = require('./discover');
const reward = require('./reward');
const {privateToPublic} = require('./utils');

console.log('start time: ', new Date());

async function run() {
	const privateKey = process.env.PRIVATE_KEY;

	for (const chain of chains) {
		const publicKey = privateToPublic(privateKey, chain.keyPrefix);
		const accounts = await discover(chain.rpcUrl, publicKey);
		for (const account of accounts) {
			await reward(chain.chainId, chain.rpcUrl, privateKey, account.account_name, chain.systemAccount, chain.keyPrefix)
		}
	}
}

run();

cron.schedule('0 */1 * * *', () => {
  console.log('Date', new Date());
  run();
});
