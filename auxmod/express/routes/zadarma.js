const path = require('path');
const express = require('express');
const router = express.Router();

const multer = require('multer');
const upload = multer();

const moment = require('moment');
moment.locale("ru");


const bot = require(path.join(process.env.DIR, 'auxmod', 'telegram', 'enebra'));
const api = require(path.join(process.env.DIR, 'auxmod', 'zadarma_api'));
api.setDefaultPhoneNumberFrom(process.env.ZADARMA_DAFAULT_PHONE_NUMBER_FROM);

let zadarmaEventHandlers = {
    temporary_storage: {},
    NOTIFY_START: async function(obj){
        
        let phone_call = {
            start: obj.call_start,
            id: obj.pbx_call_id,
            from: obj.caller_id,
            to: obj.called_did,
        }
        phone_call.price = await api.getCallPrice(phone_call);
        phone_call.balance = await api.getAccountBalance();
        this.temporary_storage[phone_call.id] = phone_call;

        let a = {
            event: 'NOTIFY_START',
            call_start: '2020-04-03 14:07:26',
            pbx_call_id: 'in_b9ece52e1505a214e6ba05f93430ec60bd5213bf',
            caller_id: '+380989897908',
            called_did: '380947102794'
        }
    },
    NOTIFY_OUT_START: async function(obj){

        let phone_call = {
            start: obj.call_start,
            id: obj.pbx_call_id,
            from: obj.caller_id,
            internal: obj.internal,
            to: obj.destination,
        }

        phone_call.price = await api.getCallPrice(phone_call);
        phone_call.balance = await api.getAccountBalance();

        this.temporary_storage[phone_call.id] = phone_call;

        let a = {
            event: 'NOTIFY_OUT_START',
            call_start: '2020-04-03 14:26:47',
            pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
            caller_id: '0',
            internal: '100',
            destination: '+380989897908'
        }
    },

    NOTIFY_END: async function(obj){//конец входящего разговора
        if(obj.disposition == 'answered'){//входящий звонок трубку взяли
        //if(obj.status_code === '16'){
            return;
        }

        return;
        delete this.temporary_storage[obj.pbx_call_id]
        this.temporary_storage[obj.pbx_call_id].status_code = obj.status_code;
        this.temporary_storage[obj.pbx_call_id].disposition = obj.disposition;
        this.temporary_storage[obj.pbx_call_id].duration = obj.duration;
        this.temporary_storage[obj.pbx_call_id].is_recorded = obj.is_recorded;

        

        //пропущенный входящий звонок
        //console.log(obj);

        // let message = `⚠️ ${obj.status_code} ${obj.disposition}\n`+
        //     `${/^out_/.test(obj.pbx_call_id) ? '⬆️': '⬇️'}` +
        //     ` ${obj.call_start.split(' ').pop()}\n` +
        //     `+${(obj.phone_outside).split('+').pop()}\n` +
        //     `${obj.price.description.replace(' - Mobile', ' 📱')}\n` +
        //     `💵 <code>${obj.price.price}</code>    💳 <code>${obj.balance.balance}</code>`;

        // global.enebrabot.sendMessage(telegram_chat_id,
        //     message, {
        //     disable_notification: false,
        //     disable_web_page_preview: true,
        //     parse_mode: 'HTML'
        // });
    },
    NOTIFY_OUT_END: async function(obj){
        // this.temporary_storage[obj.pbx_call_id].status = obj.status_code;
        // delete this.temporary_storage[obj.pbx_call_id];



        let a = {
            event: 'NOTIFY_OUT_END',
            call_start: '2020-04-03 14:26:47',
            pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
            caller_id: '0',
            internal: '100',
            destination: '+380989897908',
            duration: '0',
            disposition: 'cancel',
            status_code: '16',
            is_recorded: '1',
            call_id_with_rec: '1585913205.75283'
        }


    },
    NOTIFY_RECORD: async function(obj){
        this.temporary_storage[obj.pbx_call_id].call_id_with_rec = obj.call_id_with_rec;

        setTimeout(async () => {
            let url_record = await api.getRecordFileUrl(obj);
        }, 10000);

        // let a = {
        //     event: 'NOTIFY_RECORD',
        //     pbx_call_id: 'in_394b269d3ae9043550ea60e0fa826ff689beac13',
        //     call_id_with_rec: '1585918082.92858'
        // }
        
        // obj.phone_outside = '+' + ((obj.phone_outside).split('+').pop());
        
        // setTimeout(async () => {
        //     let url_record = await api.getRecordFileUrl(obj);
            
        //     let caption = `${/^out_/.test(obj.pbx_call_id) ? '⬆️': '⬇️'}` +
        //     ` ${obj.call_start.split(' ').pop()}\n` +
        //     `${obj.phone_outside}\n` +
        //     `${obj.price.description.replace(' - Mobile', ' 📱')}\n` +
        //     `💵 ${obj.price.price}    💳 ${obj.balance.balance}`;

            // global.enebrabot.sendAudio(telegram_chat_id, {
            //     url: url_record,
            //     filename: obj.phone_outside + ' ' + obj.call_start + '.mp3'
            // },{
            //     caption: caption
            // },{
            //     disable_notification: true,
            //     disable_web_page_preview: true,
            //     parse_mode: 'HTML'
            // });
        //}, 10000);
    },
    SMS: async function(obj){
        console.log(obj);

        bot.sendMessage(283404954,
            `<code>📨 SMS ${obj.caller_did.slice(-9)}</code>\n\n`+
            `📞 +${obj.caller_id}\n\n`+
            `${obj.text}`,
        {
            disable_notification: true,
            disable_web_page_preview: true,
            parse_mode: 'HTML'
        });
    }
}

router.use('/', upload.none(), async function(req, res) {
    res.end();
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(':').pop();
    
    if(ip !== '185.45.152.42'){//проверка на подлинность
        return res.end();
    }else if(req.query && req.query.zd_echo){
        return res.end(req.query.zd_echo);
    }

    if(/form-data/.test(req.headers['content-type'])){
        req.body = Object.assign(req.body, JSON.parse(req.body.result));
    }

    if(req.body && typeof req.body === 'object' && req.body.event){
        //if(Object.keys(module_functions).indexOf(req.body.event) !== -1){
        
        if(typeof zadarmaEventHandlers[req.body.event] === 'function'){

            zadarmaEventHandlers[req.body.event](req.body);
            //temporary_storage[req.body.pbx_call_id]
            // temporary_storage[req.body.pbx_call_id] = Object.assign(
            //     temporary_storage[req.body.pbx_call_id] || {},
            //     req.body
            // )
            // if(req.body.destination){
            //     temporary_storage[req.body.pbx_call_id].phone_outside = req.body.destination
            // }else if(req.body.caller_id){
            //     temporary_storage[req.body.pbx_call_id].phone_outside = req.body.caller_id
            // }
            // module_functions[req.body.event](temporary_storage[req.body.pbx_call_id]);
        }
    }
});

module.exports = router;



// let module_functions = {
//     NOTIFY_START: async obj => {
//         temporary_storage[obj.pbx_call_id].price = await api.price({to: obj.caller_id});
//         temporary_storage[obj.pbx_call_id].balance = await api.balance();
        
        
//         let a = {
//             event: 'NOTIFY_START',
//             call_start: '2020-04-03 14:07:26',
//             pbx_call_id: 'in_b9ece52e1505a214e6ba05f93430ec60bd5213bf',
//             caller_id: '+380989897908',
//             called_did: '380947102794'
//         }
//     },
//     NOTIFY_OUT_START: async obj => {
//         temporary_storage[obj.pbx_call_id].price = await api.price({to: obj.destination});
//         temporary_storage[obj.pbx_call_id].balance = await api.balance();

//         let a = {
//             event: 'NOTIFY_OUT_START',
//             call_start: '2020-04-03 14:26:47',
//             pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
//             caller_id: '0',
//             internal: '100',
//             destination: '+380989897908'
//         }
//     },
//     NOTIFY_END: obj => {//конец входящего разговора
//         if(obj.disposition == 'answered'){//входящий звонок трубку взяли
//         //if(obj.status_code === '16'){
//             return;
//         }
        
//         //пропущенный входящий звонок
//         //console.log(obj);

//         let message = `⚠️ ${obj.status_code} ${obj.disposition}\n`+
//             `${/^out_/.test(obj.pbx_call_id) ? '⬆️': '⬇️'}` +
//             ` ${obj.call_start.split(' ').pop()}\n` +
//             `+${(obj.phone_outside).split('+').pop()}\n` +
//             `${obj.price.description.replace(' - Mobile', ' 📱')}\n` +
//             `💵 <code>${obj.price.price}</code>    💳 <code>${obj.balance.balance}</code>`;

//         global.enebrabot.sendMessage(telegram_chat_id,
//             message, {
//             disable_notification: false,
//             disable_web_page_preview: true,
//             parse_mode: 'HTML'
//         });
//     },
//     NOTIFY_OUT_END: async obj => {
//         let a = {
//             event: 'NOTIFY_OUT_END',
//             call_start: '2020-04-03 14:26:47',
//             pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
//             caller_id: '0',
//             internal: '100',
//             destination: '+380989897908',
//             duration: '0',
//             disposition: 'cancel',
//             status_code: '16',
//             is_recorded: '1',
//             call_id_with_rec: '1585913205.75283'
//         }
//     },
//     NOTIFY_RECORD: async obj => {

//         let a = {
//             event: 'NOTIFY_RECORD',
//             pbx_call_id: 'in_394b269d3ae9043550ea60e0fa826ff689beac13',
//             call_id_with_rec: '1585918082.92858'
//         }
        
//         obj.phone_outside = '+' + ((obj.phone_outside).split('+').pop());
        
//         setTimeout(async () => {
//             let url_record = await api.record(obj);
            
//             let caption = `${/^out_/.test(obj.pbx_call_id) ? '⬆️': '⬇️'}` +
//             ` ${obj.call_start.split(' ').pop()}\n` +
//             `${obj.phone_outside}\n` +
//             `${obj.price.description.replace(' - Mobile', ' 📱')}\n` +
//             `💵 ${obj.price.price}    💳 ${obj.balance.balance}`;

//             global.enebrabot.sendAudio(telegram_chat_id, {
//                 url: url_record,
//                 filename: obj.phone_outside + ' ' + obj.call_start + '.mp3'
//             },{
//                 caption: caption
//             },{
//                 disable_notification: true,
//                 disable_web_page_preview: true,
//                 parse_mode: 'HTML'
//             });
//         }, 10000);
//     },
//     SMS: obj => {
//         global.enebrabot.sendMessage(telegram_chat_id,
//             `⬇️ 📨 SMS\n`+
//             `📞 +${obj.caller_id}\n`+
//             `<code>${obj.caller_did}</code>\n\n`+
//             `${obj.text}`,
//         {
//             disable_notification: true,
//             disable_web_page_preview: true,
//             parse_mode: 'HTML'
//         });
//     }
// }


// console.log(req.body)
//     let sms_headers = {
//         'user-agent': 'Zadarma API',
//         host: '167.71.12.44:8080',
//         accept: '*/*',
//         signature: 'OTI1ZTIwYjZmYzQ4MWM2YjM2ZTBjOWI0ZGNlNTdjZTE3YmI0MGRmNA==',
//         'content-length': '330',
//         expect: '100-continue',
//         'content-type': 'multipart/form-data; boundary=----------------------------bc73bf4f2aad'
//       }

//     let other_headers = {
//         'user-agent': 'Zadarma API v1',
//         host: '167.71.12.44:8080',
//         accept: '*/*',
//         signature: 'OGI0YmY4ZGI5ZWEwMDJjNGJkM2E4ZjU4YWJhODZlODRhMWIzZmVkNw==',
//         'content-length': '216',
//         'content-type': 'application/x-www-form-urlencoded'
//     }


const call_disposition = {
    'answered': 'разговор',
    'busy': 'занято',
    'cancel': 'отменен',
    'no answer': 'без ответа',
    'failed': 'не удался',
    'no money': 'нет средств, превышен лимит',
    'unallocated number': 'номер не существует',
    'no limit': 'превышен лимит',
    'no day limit': 'превышен дневной лимит',
    'line limit': 'превышен лимит линий',
    'no money, no limit': 'превышен лимит'
}

let a = {
    event: 'NOTIFY_START',
    call_start: '2020-04-03 14:07:26',
    pbx_call_id: 'in_b9ece52e1505a214e6ba05f93430ec60bd5213bf',
    caller_id: '+380989897908',
    called_did: '380947102794',


    event: 'NOTIFY_OUT_START',
    call_start: '2020-04-03 14:26:47',
    pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
    caller_id: '0',
    internal: '100',
    destination: '+380989897908',


    event: 'NOTIFY_END',
    call_start: '2020-04-03 13:53:27',
    pbx_call_id: 'in_ebfde719b6137eac462cb8506d977e3bb21bdc6a',
    caller_id: '+380989897908',
    called_did: '380947102794',
    duration: '0',
    disposition: 'cancel',
    status_code: '16',
    is_recorded: '0',


    event: 'NOTIFY_OUT_END',
    call_start: '2020-04-03 14:26:47',
    pbx_call_id: 'out_dcb22bcd4e78fa4b627aa2e0c67d0191cd0a5068',
    caller_id: '0',
    internal: '100',
    destination: '+380989897908',
    duration: '0',
    disposition: 'cancel',
    status_code: '16',
    is_recorded: '1',
    call_id_with_rec: '1585913205.75283'
}
