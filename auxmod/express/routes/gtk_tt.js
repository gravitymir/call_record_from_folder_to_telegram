const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale("ru");

const obj = {
  0: { 0: 1, 1: 2 },
  1: { 0: 3, 1: 1 },
  2: { 0: 4, 1: 3 },
  3: { 0: 2, 1: 4 }
};

const start = 1571115600;
const _96 = 345600;
const _24 = 86400;

function tick_gtk_tt(data){
    m = Number(data.m) || 0;

    let now = moment().add(m, 'month');
    let month = moment(now).month();

    let start_month = moment(now).startOf('month');
    let end_month = moment(now).endOf('month');

    let t_start = moment(start_month).startOf('week');
    let t_end = moment(end_month).endOf('week');

    let t_lenght = Math.round((moment(t_end).unix() - moment(t_start).unix()) / _24);
    
    let smena = parseInt((moment(t_start).unix() - start) % _96 / _24);

    let arr = [];
    for(let i = 1; i <= t_lenght; i++){
      arr.push({
        smena: `smena_${obj[(smena + i) % 4][0]}${month == t_start.month() ? '': '_black'}`,
        date: t_start.date()
      });

      t_start.add(1, 'day');
    }
    

    
    return {
        arr: arr,
        data_block: t_lenght > 35 ? 755: t_lenght > 28 ? 645: 535,
        time_block: `${moment(now).format('MMMM').charAt(0).toUpperCase()}`+
          `${moment(now).format('MMMM').slice(1)}`+
          ` ${moment(now).format('MM.YYYY')} винил`,
        hide_control: data.hide_control,
        next: {
          m_name: moment(now).add(1, 'month').format('MMMM'),
          m: m + 1
        },
        prev: {
          m_name: moment(now).subtract(1, 'month').format('MMMM'),
          m: m - 1
        }
    };
}

router.get('/', function(req, res) {
    res.render('gtk_tt/gtk_tt', 
    {
        title: 'Таблица',
        data: tick_gtk_tt(req.query)
    });
    res.end();
});

module.exports = router;
