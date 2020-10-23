const CronJob = require('cron').CronJob;
const path = require('path');
const prom_ua = require(path.join(process.env.DIR, "auxmod", 'prom_ua'));
const bot = require(path.join(process.env.DIR, 'auxmod', 'telegram', 'prom_ua'));

async function job() {

  let subscribers = await prom_ua.get_subscribers_from_db();

  for (subscriber of subscribers) {
    for (platform_name of Object.keys(subscriber.platforms)) {
      if ((platform_name === "prom_ua" || platform_name === "tiu_ru") && subscriber.platforms[platform_name].enable) {
        let orders_from_platform = await prom_ua.get_orders_from_platform(subscriber.platforms[platform_name].url);

        if (orders_from_platform) {//нет ошибки считавания по переданной ссылки(orders получены)

          let past_orders = subscriber.platforms[platform_name].past_orders.map(el => el.id);//все id прошлых (orders) заказов
          //test past_orders.shift();
          let new_orders = orders_from_platform
            .map(order => !past_orders.includes(order.id) && order)
            .filter(i => i);

          if (new_orders.length) {
            subscriber.platforms[platform_name].past_orders.push(...new_orders);

            for (order of new_orders) {
              let { method, url, caption, media, opt } = await prom_ua.prepare_order_to_message_media({
                order: order, platform_name: platform_name.replace('_', '.')
              });
              
              bot[method]({ id: subscriber.id, media: media || url, caption: caption, opt: opt });
              prom_ua.update_subscriber_to_db(subscriber);//перезаписать подписчика с данным изменением
            }
          }
        } else {//ошибка ссылка не валидна get_orders_from_platform вернул false
          subscriber.platforms[platform_name].enable = false;//поставить флаг что ссылка не валидна
          prom_ua.update_subscriber_to_db(subscriber);//перезаписать подписчика с данным изменением

          platform_name = platform_name.replace('_', '.');
          bot.sendMessage(subscriber.id,//проинформировать подписчика
            `⚠️ Информирование от портала <a href='https://my.${platform_name}/cms/order'>${platform_name}</a> остановлено.` +
            `\n📎 Причина: "ссылка не действительна."` +
            `\n☑️ Для возобновления информировани пришлите валидную ссылку.`);
        }
      }
    }
  }
}

new CronJob({
  cronTime: '0 */5 * * * *',
  onTick: job,
  start: true,
  timeZone: 'Europe/Moscow',
  context: {}
});

console.log('CronJob "prom_ua" is started!!!');