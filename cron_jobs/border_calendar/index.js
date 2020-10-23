const CronJob = require('cron').CronJob;
const moment = require('moment');
moment.locale("ru");
const path = require('path');
//const chat_id = -1001223476082;//гоптовка
//const chat_id = -1001124219285;
const chat_id = 283404954;



const bot = require(path.join(process.env.DIR, 'auxmod', 'telegram', 'yozhik'));
const puppeteer = require('puppeteer');

async function border_calendar(){
    const browser = await puppeteer.launch();
}

async function border_calendar_old(){
  let aux_time = moment();
  
  //if(aux_time.add(1, 'day').date() !== 1) return console.log('Не пройдена проверка на дату, сейчас не последний день месяца');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({
      width: 1046,
      height: 755
  });


  
  await page.goto(`http://${process.env.IP}:8080/gtk_tt?m=1&hide_control=1`);
  let data_block = await page.$eval("#data_block", element=> element.textContent);
  let time_block = await page.$eval("#time_block", element=> element.textContent);
  
  let r = await page.screenshot({
    path: path.join(process.env.DIR, '..', 'border_calendar.png'),
    clip: { x: 0, y: 0, width: 1046, height: Number(data_block) }
  });
  
  let {message_id: m_id} = await bot.sendPhoto(chat_id,//283404954
    {
      source: path.join(process.env.DIR, '..', 'border_calendar.png'),
      filename: 'Виниловый_график.png'
    },
    {
        caption: time_block
    }
  );

  await bot.pinChatMessage(chat_id, m_id);

  await page.goto(`http://${process.env.IP}:8080/tt_masty?m=1&hide_control=1`);
  time_block = await page.$eval("#time_block", element=> element.textContent);
  
  r = await page.screenshot({
    path: path.join(process.env.DIR, '..', 'border_calendar_masty.png'),
    clip: { x: 0, y: 0, width: 1046, height: Number(data_block) }
  });
  
  await bot.sendPhoto(chat_id,//283404954
    {
      source: path.join(process.env.DIR, '..', 'border_calendart_masty.png'),
      filename: 'Масти_график.png'
    },
    {
        caption: time_block
    }
  );
  await browser.close();
};

new CronJob({
	//cronTime: '0 0 20 28-31 * *',
	cronTime: '0 0 18 28-31 * *',
	//cronTime: '0 1 * * * *',
	onTick: border_calendar,
	start: true,
	timeZone: 'Europe/Moscow',
	context: {}
});