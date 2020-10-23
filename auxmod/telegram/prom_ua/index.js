const Telegraf = require('telegraf');
const moment = require('moment');
moment.locale("ru");
require('colors');
const path = require('path');
const fs = require('fs');
const tar = require('tar');
const db = require(path.join(process.env.DIR, "auxmod", "mongodb"));
const prom_ua = require(path.join(process.env.DIR, "auxmod", 'prom_ua'));

let bot = new Telegraf('287852396:AAGqkYCPPqf60dy53704XQBMxIx91QkRVVs');
bot.context.owner = 283404954;
bot.context.owner_chat_log = -1001356015061;
bot.context.id = 287852396;
bot.context.first_name = 'promuabot';
bot.context.username = 'promuabot';

bot.telegram.getMe().then(async function getBotInfo(botInfo) {
  console.log('telegram bot: '.dim + String(botInfo.id + ' ' + botInfo.first_name + ' ' + botInfo.username).bold.dim + ' is started'.dim);
});

bot.catch(e => console.log('Ooops', e));

bot.use(function (a, next) {
  console.log(a.update)
  next();
})

bot.on("new_chat_members", async ctx => {
  if (ctx.update.message.new_chat_member.id === ctx.id) {
    let resp = await ctx.reply(`ℹ️ Чат\nid: ${ctx.update.message.chat.id}\n` +
      `title: ${ctx.update.message.chat.title}\n` +
      `type: ${ctx.update.message.chat.type}`);

    ctx.leaveChat(ctx.chat.id);
  }
})

//https:\/\/my\.(prom\.ua|tiu\.ru|satu\.kz|deal\.by)\/cabinet\/export_orders\/xml\/\d+\?hash_tag=[a-z0-9]{32}/
bot.hears(/https:\/\/my\.(prom\.ua|tiu\.ru|satu\.kz|deal\.by)\/cabinet\/export_orders\/xml\/\d+\?hash_tag=[a-z0-9]{32}/, async ctx => {

  if (ctx.match[1] === "satu.kz" || ctx.match[1] === "deal.by") {
    ctx.reply(`ℹ️ информирование на платформе ${ctx.match[1]} в данный момент не работает.\n` +
      `Узнать когда будет работать: @ssplast`);
    return ctx;
  }

  await ctx.reply(`⌛️ ожидайте идёт анализ ссылки.`);

  let orders = await prom_ua.get_orders_from_platform(ctx.match[0]);
  
  //let res = await db.delete_one({collection: "promuabot_subscribers", _id: ctx.from.id});
  let subscriber = await prom_ua.get_one_subscriber_from_db(ctx.from.id);

  //dot is bad for BD write
  let platform_name = ctx.match[1].replace('.', '_');

  if (subscriber) {
    if (Object.keys(subscriber.platforms).includes(platform_name)) {//если уже есть запись о портале страны
      subscriber.platforms[platform_name].enable = true;
      subscriber.platforms[platform_name].chat = ctx.from.id;
      subscriber.platforms[platform_name].url = ctx.match[0];
    } else {//add subscriber platform [platform_name]
      subscriber.platforms[platform_name] = {
        enable: true,
        chat: ctx.from.id,
        url: ctx.match[0],
        past_orders: []
      }
    }
  } else {//create new subscriber
    subscriber = {
      ...ctx.from,
      platforms: {
        [platform_name]: {
          enable: true,
          chat: ctx.from.id,
          url: ctx.match[0],
          past_orders: []
        }
      }
    }
  }

  if (orders) {
    orders.forEach(order => {

      let { method, url, caption, media, opt } = prom_ua.prepare_order_to_message_media(
        {
          order: order,
          platform_name: ctx.match[1]
        });

      ctx.telegram[method](ctx.from.id, media || { url: url }, { caption: caption, ...opt });
    });

    ctx.reply(`Отлично, информирование начато.\n` +
      `Платформа: ${ctx.match[1]}\n` +
      `Ссылка: ${ctx.match[0]}\n` +
      `Чат информирования: ${ctx.from.first_name} ${ctx.from.id}\n\n` +
      `ℹ️ Чат информирования можно изменить.\n` +
      `Пригласите меня в другой чат (группу), для многопользовательского просмотра уведомлений.\n\n` +
      `ℹ️ Отключить информирование можно нажав на кнопку "обновить ссылку" в вашем кабинете (по инструкции на 3 шаге)`);

    prom_ua.update_subscriber_to_db(subscriber);

  } else {
    subscriber.platforms[platform_name].enable = false;
    prom_ua.update_subscriber_to_db(subscriber);
    ctx.reply(`⚠️ не удалось получить заказы, ссылка не валидна, перепроверьте ссылку.\n\n` +
      `Платформа: ${ctx.match[1]}\n` +
      `Ссылка: ${ctx.match[0]}\n` +
      `Чат информирования: ${ctx.from.first_name} ${ctx.from.id}\n\n` +
      `ℹ️ информирование ${ctx.match[1]} остановлено.`);
  }

  return ctx;
})

bot.command('start', async ctx => {

  prom_ua.update_subscriber_to_db({
    ...ctx.from,
    platforms: {}
  });

  ctx.replyWithPhoto({
    source: fs.createReadStream(path.join(process.env.DIR, 'auxmod/telegram/prom_ua/instruction.png'))
  }, {
    //caption: "Интеграция с платформой:\nProm, Tiu, Satu, Deal.\n\n"+
    caption: "Интеграция с платформой:\nProm, Tiu.\n\n" +
      "Информирование о заказах.\n\n" +
      "Для интеграции перейдите по одной из приведённых ссылок в свой кабинет продавца (быть залогиненым).\n" +
      "Скопируйте ссылку и отправте её здесь (вставте в поле ввода текста, нажмите отправить).",

    disable_notification: false,
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard:
        [[{
          text: '🇺🇦 Prom.ua', url: 'https://my.prom.ua/cms/order'
        }], [{
          text: '🇷🇺 Tiu.ru', url: 'https://my.tiu.ru/cms/order'
        }]
          // ,[{
          //     text: '🇰🇿 Satu.kz', url: 'https://my.satu.kz/cms/order'
          // }],[{
          //     text: '🇧🇾 Deal.by', url: 'https://my.deal.by/cms/order'
          // }]
        ]
    }
  })
  return ctx;
})

bot.command('node', ctx => {
  if (ctx.from.id === ctx.owner) {
    let write = fs.createWriteStream(path.join(process.env.DIR, '..', ctx.username + '.tar'));

    write.on('finish', async function packIsFinished() {
      ctx.replyWithDocument(
        {
          source: fs.createReadStream(path.join(process.env.DIR, '..', ctx.username + '.tar')),
          filename: ctx.username + '.tar'
        }, {
        caption: moment().format('YYYY.MM.DD HH:mm:ss')
      })
    });
    tar.c({ gzip: true }, [path.join(process.env.DIR)]).pipe(write)
  }
  return ctx;
})

bot.command('mongodb', async ctx => {
  if (ctx.from.id === ctx.owner) {
    let arr = await db.list_collections({});
    const dir = path.join(process.env.DIR, '..', "mongodb_collections");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    if (arr && Array.isArray(arr) && arr.length) {
      arr.forEach(async coll_name => {

        let collection = await prom_ua.get_subscribers_from_db();
        if (!collection) return;
        let jsonContent = JSON.stringify(collection);

        fs.writeFile(path.join(process.env.DIR, '..', "mongodb_collections", coll_name.name + ".json"), jsonContent, 'utf8', async function (err) {
          if (err) return console.log(err);

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
  sendMessage: async function (id, str, opt) {
    opt = Object.assign({
      disable_notification: false,
      disable_web_page_preview: false,
      parse_mode: 'HTML'
    }, opt);

    return await bot.telegram.sendMessage(id, str, opt);
  },
  sendPhoto: async function ({ id, media, sorce, caption, opt }) {
    opt = Object.assign({
      disable_notification: false,
      disable_web_page_preview: false,
      parse_mode: 'HTML'
    }, opt);

    //{sorce: 'path'} path недопрограмиировонно!  
    let file = media ? { url: media } : { sorce: 'path' };

    return await bot.telegram.sendPhoto(id, file, { caption: caption, ...opt });
  },
  leaveChat: async function (chatId) {
    return await bot.telegram.leaveChat(chatId);
  }
}