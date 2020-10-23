const Telegraf = require('telegraf');
const moment = require('moment');
moment.locale("ru");
require('colors');
const path = require('path');
const fs = require('fs');
const tar = require('tar');
const db = require(path.join(process.env.DIR, "auxmod", "mongodb"));

let bot = new Telegraf('354215638:AAEmWoBPUf7544u_xGBljYDwGlDHyPnlJ2E');
bot.context.owner = 283404954;
bot.context.id = 354215638;
bot.context.first_name = 'Enebra';
bot.context.username = 'enebrabot';

bot.telegram.getMe().then(async function getBotInfo(botInfo){
    console.log('telegram bot: '.dim + String(botInfo.id + ' ' + botInfo.first_name + ' ' + botInfo.username).bold.dim + ' is started'.dim);
});

bot.catch(e => console.log('Ooops', e));
bot.use(function(a,next){
    console.log(a.update)
    next();
})

bot.command('node_start_call_records_explore', ctx => {
    if(ctx.from.id == ctx.owner){
        
    }
    return ctx;
})

bot.startPolling();
module.exports = {
    sendMessage: async function sendMessage(id, str, opt){
        opt = Object.assign({
            disable_notification: false,
            disable_web_page_preview: false,
            parse_mode: 'HTML'
        }, opt);
        return await bot.telegram.sendMessage(id, str, opt);
    }
}
