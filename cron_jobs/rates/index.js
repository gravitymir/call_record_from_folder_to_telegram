const CronJob = require('cron').CronJob;
const path = require('path');

const bot = require(path.join(process.env.DIR, "auxmod", "telegram", "kitbitok"));
const rate = require(path.join(process.env.DIR, "auxmod", "rates", "index.js"));
async function job(){
	console.log("rates tick");
	let subscribers = await rate.get_subscribers();
	let rates = await rate.changes_rates();
	let rates_opt = await rate.changes_rates_opt();

	let inform = await rate.prepare_inform({subscribers, rates, rates_opt});

	for (chat_id in inform) {
		bot.sendMessage(chat_id, '<code>' + inform[chat_id] + '</code>', {
			disable_notification: true,
			disable_web_page_preview: false,
			parse_mode: 'HTML'
		})
	}
}

new CronJob({
	cronTime: '0 0,5,10,15,20,25,30,35,40,45,50,55 8-17 * * *',
	onTick: job,
	start: true,
	timeZone: 'Europe/Kiev',
	context: {}
});
console.log('CronJob "rates" is started!!!');