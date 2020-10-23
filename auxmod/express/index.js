const path = require('path');
const express = require('express');
const http = require('http');
const favicon = require('serve-favicon');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
//const session = require('express-session');
const compression = require('compression');

let app = express();
let errors = require(path.join(process.env.DIR, '/auxmod/express/middleware/errors'));

app.set('views', path.join(process.env.DIR, '/auxmod/express/views/ejs'));
app.set('view engine', 'ejs');
app.disable('x-powered-by');
app.use(compression());
app.use(favicon(path.join(process.env.DIR, '/auxmod/express/public/img/favicon.ico')));
app.use(require(path.join(process.env.DIR, '/auxmod/express/middleware/console_log')));//consoleLog
// // app.use(function(req, res, next) {
// //     global.INSPECT(req.headers);
// //     global.INSPECT(req.body);
// //     global.INSPECT(req.query);
// //     global.INSPECT(req.result);
// //     global.INSPECT(req.data);
// //     res.end(req.body);
// // });
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(session({secret: 'gopgoptable',
//     cookie: {
//         httpOnly: true, 
//         secure: true,
//         expires: moment().add(12, 'hours').toDate()
//     },
//     resave: true, saveUninitialized: true})
// );
app.use(express.static(path.join(process.env.DIR, '/auxmod/express/public')));
//console.log(inspect({"_id":2,"id":"10476866","state":"accepted","name":"Дмитриева Татьяна","phone":"79005938950","email":"ya.t-2-a-3-n-0-y-2-a-96@yandex.ru","date":"27.05.18 01:41","address":"Липецк, Улица Филипченко д. 9/2 кв. 18","paymentType":"Наличными","deliveryType":"Доставка курьером","priceRUB":"3200.00","source":"Портал","cancellationReason":"Нет в наличии","items":{"item":[{"id":"345652869","name":"Шлепки с мехом песца","quantity":"1.00","currency":"RUB","image":"https://images.ru.prom.st/529366068_w640_h640_shlepki_foto.png","url":"https://prommir.com/p345652869-shlepki-mehom-pestsa.html","price":"3200.00","sku":false}]},"manager":"@ssplast","take_time_manager":"1530040816314","zatratu":[],"delivery_company":null,"track":null,"status":"Принят","telegram_zakaz_message_id":15972,"call_cost":{"status":"success","info":{"prefix":"79","description":"Russia - Mobile","price":0.055,"currency":"USD"}},"telegram_manager_message_id":16006}, { colors: true, depth: Infinity }));
//app.use('/', require(path.join(process.env.DIR, '/auxmod/express/routes/index')));
app.use('/', require(path.join(process.env.DIR, '/auxmod/express/routes/gtk_tt')));
app.use('/gtk_tt', require(path.join(process.env.DIR, '/auxmod/express/routes/gtk_tt')));
app.use('/tt_masty', require(path.join(process.env.DIR, '/auxmod/express/routes/tt_masty')));
app.use('/tt_nums', require(path.join(process.env.DIR, '/auxmod/express/routes/tt_nums')));
//app.use('/sentry', require(path.join(process.env.DIR, '/auxmod/express/routes/sentry')));//караульный
app.use('/zadarma', require(path.join(process.env.DIR, '/auxmod/express/routes/zadarma')));
app.use(errors.notfound);
app.use(errors.serverError);

let server = http.createServer(app);

server.listen(8080, () => {
    console.log(`Server running at http://${process.env.IP}:8080/`);
});

setTimeout(function(){
    let used = process.memoryUsage();
    for (let key in used) {
        console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
    }
}, 2000);