const cron = require('node-cron');
const config = require('./config');
const reward = require('./reward');

console.log('config', config)
cron.schedule('1 * * * *', () => {
  console.log('Date', new Date());
	
	reward(config);
});
