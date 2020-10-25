const Telegraf = require('telegraf');
const moment = require('moment');
moment.locale("ru");
require('colors');
const path = require('path');
const fs = require('fs');
const { time } = require('console');

let bot = new Telegraf('354215638:AAEmWoBPUf7544u_xGBljYDwGlDHyPnlJ2E');
bot.context.owner = 283404954;
bot.context.id = 354215638;
bot.context.first_name = 'Enebra';
bot.context.username = 'enebrabot';

bot.telegram.getMe().then(async function getBotInfo(botInfo){
    console.log('telegram bot: '.dim + String(botInfo.id + ' ' + botInfo.first_name + ' ' + botInfo.username).bold.dim + ' is started'.dim);
    start();
});

var chat_id = -464380372
var path_to_folder = path.join(process.env.DIR, "..", "Call")

bot.catch(e => console.log('Ooops', e));
bot.use(function(a,next){
    console.log(a.update)
    next();
})
bot.startPolling()

var sort_array = [];
var obj_names = {};
var time_interval;

async function start(){
    fs.readdir(path_to_folder, async (err, files) => {

        //Array.from(new Set(["b","a","c"])).sort();
        //[...(new Set(["b","a","c"]))].sort(); // with spread.

        for(let i = 0; i < files.length; i++){
            let original_file_name = files[i];
            file_name = original_file_name
                .replace("Запись вызовов ", "")
                .replace("Запись_вызовов_", ""); 

            let arr_of_chunks_name = file_name.split("_");
            
            let time_ext = arr_of_chunks_name.pop();
            let [time, ext] = time_ext.split(".");
            let date = arr_of_chunks_name.pop();

            let from = [...arr_of_chunks_name].join(" ");
            let mom = moment(date+time, "YYMMDDHHmmss");

            obj_names[date + time] = {
                original_file_name: original_file_name,
                from: from,
                hash: "#"+from.replace("+", "").replace(/\s/g, ""),
                YYMMDD: date,
                hhmmss: time,
                ext: ext,
                yy: mom.format("YYYY.MM.DD MMMM"),
                hh: mom.format("HH:mm:ss dddd")
            };
            sort_array.push(date + time);
        }

        sort_array = Array.from(new Set(sort_array)).sort();

        // for(let i = 0; i < sort_array.length; i++){
        //     let el = obj_names[sort_array[i]]


        //     let mom = moment(el.YYMMDD+el.hhmmss, "YYMMDDHHmmss")
        //     let yy = moment(el.YYMMDD+el.hhmmss, "YYMMDDHHmmss").format("YYYY.MM.DD MMMM")
        //     let hh = mom.format("HH:mm:ss dddd")

        //     console.log(el.hash);
        //     console.log(el.from);
        //     console.log(hh);
        //     console.log(yy);
        //     console.log(moment().format("x"));
            

            
            
        // }
        time_interval = setInterval(send, 5000)
    })
}


function send(){
    let id = sort_array.shift();
    console.log(sort_array.length, id)
    if(!id){
        clearInterval(time_interval);
        return;
    }
    let el = obj_names[id];

    bot.telegram.sendDocument(
        chat_id,
        {
            source: fs.createReadStream(path.join(path_to_folder, el.original_file_name)),
            filename: `${el.from}_${el.YYMMDD}_${el.hhmmss}.${el.ext}`
        },{
            caption: `${el.hash}\n${el.from}\n${el.hh}\n`+
            `${el.yy}\n${moment().format("x")}`
        }
    )
}
