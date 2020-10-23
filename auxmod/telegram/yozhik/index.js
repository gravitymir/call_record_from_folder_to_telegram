const Telegraf = require('telegraf');
const moment = require('moment');
moment.locale("ru");
require('colors');
const path = require('path');
const fs = require('fs');
const tar = require('tar');
const db = require(path.join(process.env.DIR, "auxmod", "mongodb"));

let bot = new Telegraf('652358176:AAGHL_ZOhVVysvyAmZNdjBS8kTZapOPsigw');
bot.context.owner = 283404954;
bot.context.owner_chat_log = -1001356015061;
bot.context.id = 652358176;
bot.context.first_name = 'Ёжик';
bot.context.username = 'yozhik_v_tumane_bot';

bot.telegram.getMe().then(async function getBotInfo(botInfo){
    console.log('telegram bot: '.dim + String(botInfo.id + ' ' + botInfo.first_name + ' ' + botInfo.username).bold.dim + ' is started'.dim);
});

bot.catch(e => console.log('Ooops', e));

// bot.use(function(a,next){
//     console.log(a.update)
//     next();
// })
  
bot.action(/ru_centry\?(\d+)/, ctx => {
    let ru_ua_timetable = require(path.join(process.env.DIR, 'auxmod', 'border_ru_ua_timetable'));

    let {str, keyboard} = ru_ua_timetable.getSmenaTimetableStr(ctx.match[1]);

    ctx.editMessageText(`<code>${str}</code>`,
        {
            disable_notification: true,
            disable_web_page_preview: true,
            parse_mode: 'HTML',
            reply_markup: {
                    inline_keyboard: keyboard
            }
        }
    );
})

bot.command('node', ctx => {
    if(ctx.from.id == ctx.owner){
        let write = fs.createWriteStream(path.join(process.env.DIR, '..', ctx.username+'.tar'));
    
        write.on('finish', async function packIsFinished(){
            ctx.replyWithDocument(
                {
                    source: fs.createReadStream(path.join(process.env.DIR, '..', ctx.username+'.tar')),
                    filename: ctx.username+'.tar'
                }, {
                    caption: moment().format('YYYY.MM.DD HH:mm:ss')
                })
        });
        tar.c({gzip: true}, [path.join(process.env.DIR)]).pipe(write)
    }
    return ctx;
})

bot.command('mongodb', async ctx => {
	if(ctx.from.id == ctx.owner){
        let arr = await db.list_collections({});
        const dir = path.join(process.env.DIR, '..', "mongodb_collections");
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        if(arr && Array.isArray(arr) && arr.length){
            arr.forEach(async coll_name => {
                
                let collection = await db.find({collection: coll_name.name});
                if(!collection) return;
                let jsonContent = JSON.stringify(collection);

                fs.writeFile(path.join(process.env.DIR, '..', "mongodb_collections", coll_name.name + ".json"), jsonContent, 'utf8', async function(err){
                    if(err) return console.log(err);

                    await ctx.replyWithDocument({
                            source: fs.createReadStream(path.join(process.env.DIR, '..', "mongodb_collections", coll_name.name + ".json")),
                            filename: coll_name.name + ".json"
                        }, {
                            caption: `${coll_name.name}\n${moment().format('YYYY.MM.DD HH:mm:ss')}`
                        })
                });
            });
        }
	}
	return ctx;
})

bot.startPolling();

module.exports = {
    sendMessage: async function(id, str, opt){
        opt = Object.assign({
            disable_notification: false,
            disable_web_page_preview: false,
            parse_mode: 'HTML'
        }, opt);

        return await bot.telegram.sendMessage(id, str, opt);
    },
    pinChatMessage: async function(){

    },
    sendPhoto: async function({id, media, sorce, caption, opt}){
        opt = Object.assign({
            disable_notification: false,
            disable_web_page_preview: false,
            parse_mode: 'HTML'
        }, opt);

        //{sorce: 'path'} path недопрограмиировонно!  
        let file = media ? {url: media}: {sorce: 'path'};

        return await bot.telegram.sendPhoto(id, file, {caption: caption, ...opt});
    },
    leaveChat: async function(chatId){
        return await bot.telegram.leaveChat(chatId);
    }
}