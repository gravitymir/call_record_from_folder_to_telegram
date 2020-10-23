let path = require('path');
require(path.join(__dirname, "..", "config.js"));

require(path.join(process.env.DIR, "auxmod", "express"));

require(path.join(process.env.DIR, "auxmod", "telegram", "yozhik"));

require(path.join(process.env.DIR, "cron_jobs", "rates"));
require(path.join(process.env.DIR, "cron_jobs", "prom_ua"));
//require(path.join(process.env.DIR, "cron_jobs", "border_ru_ua"));
//require(path.join(process.env.DIR, "cron_jobs", "border_calendar"));

let z = require(path.join(process.env.DIR, "auxmod", "zadarma_api"));


const db = require(path.join(process.env.DIR, "auxmod", "mongodb"));



(async function(){
    let subscriber = await db.find_one({
        collection: 'promuabot_subscribers',
        find: {}
      });
    //console.log(subscriber.platforms)
})()
//db.delete_one({collection: "promuabot_subscribers", _id: 283404954});




;(async function(){
    //console.log(await z.getCallPrice({to: '67200000000', from: "67200000000"}));
    //let db = require(path.join(process.env.DIR, "auxmod", 'mongodb'));
    
    // db.update_one({
    //     collection: "promuabot_subscribers",
    //     _id: 283404954,
    //     update: {
    //         $set: {
    //             from: {
    //               id: 283404954,
    //               is_bot: false,
    //               first_name: 'Андрей',
    //               username: 'ssplast',
    //               language_code: 'ru'
    //             },
    //             prom_ua: {
    //               enable: true,
    //               chat: { id: 283404954 },
    //               url: 'https://my.prom.ua/cabinet/export_orders/xml/983997?hash_tag=1b8c245dbe13345dab0053fb404ce363',
    //               old_orders: []
    //             }
    //           }
    //     }, opt: {
    //         upsert: true
    // }});
    
    // let last_rates = await db.find_one({
    //     collection: "rate_ObmenkaKharkovUa",
    //     find: {_id: "last_rate"}
    // });


    // db.update_one({
    //     collection: "rate_ObmenkaKharkovUa",
    //     _id: "last_rate",
    //     update: {$set: {
    //         'USD:UAH': '27.67 28.00',
    //         'EUR:UAH': '32.00 32.90',
    //         'RUB:UAH': '0.367 0.385',
    //         'GBP:UAH': '34.45 35.35',
    //         'PLN:UAH': '7.00 7.25',
    //         'CZK:UAH': '1.08 1.20',
    //         'CHF:UAH': '29.55 30.30',
    //         'EUR:USD': '1.152 1.158',
    //         'USD:RUB': '71.71 72.70',
    //         'GBP:USD': '1.25 1.27'
    //     }},
    //     opt: {upsert: true}
    // })

    //console.log(last_rates)

    // const prom_ua = require(path.join(process.env.DIR, "auxmod", "prom_ua"));
    // let orders = await prom_ua.get_orders_id_array({url: "https://my.prom.ua/cabinet/export_orders/xml/983997?hash_tag=1b8c245dbe13345dab0053fb404ce361"});
    // console.log(orders)
    // const db = require(path.join(process.env.DIR, "auxmod", "mongodb"));
    // let res = await db.find({collection: "promuabot_subscribers", find: {}});
    
    // console.log(res);
})()

