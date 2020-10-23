const momentTz = require('moment-timezone');
momentTz.tz.setDefault('Europe/Moscow');
const moment = require('moment');


module.exports = {
    getKeyboard: function(depth){

        depth = Number(depth);
        let arr = [];
    
        if(depth >= 1){
            arr.push({
                text: '🔼',
                callback_data: `ru_centry?${depth - 1}`
            });
        }
    
        if(depth < 30){
            arr.push({
                text: '🔽',
                callback_data: `ru_centry?${depth + 1}`
            });
        }
    
        return [arr];
    },
    getSmena: function(){

        let start = 1571086800; //начальная точка отсчёта
        let _96 = 345600; //полный цикл 4-рёх смен
        let _24 = 86400;//сутки, две смены (день и ночь)        

        //время в данный момент
        let now = momentTz();

        //время начела дня на данный момент (00:00 tiday)
        let start_today_time_in_unix = momentTz(now).startOf('day').unix();

        //прошло с начала отсчёта
        let past_time = start_today_time_in_unix - start;

        //этап текущего цикла
        let past_full_cycles = past_time % _96;

        //этап текущей смены из цикла
        let smena_float = past_full_cycles / _24;

        //смена в данный момент
        let smena = parseInt(smena_float);

        return smena;
    },
    getSmenaTimetableStr: function(num = 1){
        let depth = Number(num);
        let str = '';

        let weekDay = {0:'Вс',1:'Пн',2:'Вт',3:'Ср',4:'Чт',5:'Пт',6:'Сб'};

        //матрица, цикличность расписания смен
        let matrix = {
            0: { 0: 1, 1: 2 },
            1: { 0: 3, 1: 1 },
            2: { 0: 4, 1: 3 },
            3: { 0: 2, 1: 4 }
        }

        //время в данный момент
        let now = momentTz();

        //вычесть один день, перейти на вчера
        now.subtract(1, 'day');

        //час из суток в данный момент
        let hour = now.hours();

        let smena = this.getSmena();

        //в сутках две смены с (8:00 до 20:00) и (20:00 до 8:00)

        if(hour >= 20 && hour <= 23){
            str += `${now.format('  DD')} ${weekDay[now.day()]}:`;
            str += `   ${matrix[(smena + 3) % 4][0]}   ${matrix[(smena + 3) % 4][1]}Н`;
            now.add(1, 'day');
            str += `\n${now.format('► DD')} ${weekDay[now.day()]}: `;
            str += `  ${matrix[smena][0]} ► ${matrix[smena][1]}Н`;
        }else if(hour >= 0 && hour < 8){
            str += `${now.format('  DD')} ${weekDay[now.day()]}:`;
            str += `   ${matrix[(smena + 3) % 4][0]} ► ${matrix[(smena + 3) % 4][1]}Н`;
            now.add(1, 'day');
            str += `\n${now.format('► DD')} ${weekDay[now.day()]}: `;
            str += `  ${matrix[smena][0]}   ${matrix[smena][1]}Н`;
        }else if(hour >= 8 && hour < 20){
            str += `${now.format('  DD')} ${weekDay[now.day()]}:`;
            str += `   ${matrix[(smena + 3) % 4][0]}   ${matrix[(smena + 3) % 4][1]}Н`;
            now.add(1, 'day');
            str += `\n${now.format('► DD')} ${weekDay[now.day()]}: `;
            str += `► ${matrix[smena][0]}   ${matrix[smena][1]}Н`;
        }

        for(i = 1; i <= depth; i++){
            smena = ++smena % 4;
        
            str += `\n${now.add(1, 'days').format('  DD')} ${weekDay[now.day()]}:`+
            `   ${matrix[smena][0]}   ${matrix[smena][1]}Н`;
            }
            
        return {
            str: `${moment().format('YYYY.MM.DD')}\n${str}\n${moment().format('HH:mm:ss')}`,
            keyboard: this.getKeyboard(depth)
        };
    }
}