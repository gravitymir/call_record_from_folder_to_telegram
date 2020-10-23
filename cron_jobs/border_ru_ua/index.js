const CronJob = require('cron').CronJob;
let path = require('path');

const bot = require(path.join(process.env.DIR, "auxmod", "telegram", "yozhik"));
const ru_ua_timetable = require(path.join(process.env.DIR, 'auxmod', 'border_ru_ua_timetable'));

function job(){
	let {str, keyboard} = ru_ua_timetable.getSmenaTimetableStr();;

	bot.sendMessage(
		283404954, 
		`<code>${str}</code>`,
		{
			disable_notification: true,
			disable_web_page_preview: true,
			parse_mode: 'HTML',
			reply_markup: {
					inline_keyboard: keyboard
				}
		}
	)
}


new CronJob({
	cronTime: '0 0 8,20 * * *',
	//cronTime: '*/1 * * * *',
	onTick: job,
	start: true,
	timeZone: 'Europe/Moscow',
	context: {}
});
