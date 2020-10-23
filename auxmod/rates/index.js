const axios = require('axios');
const cheerio = require("cheerio");
const qs = require('qs');
const Decimal = require('decimal.js');

const path = require('path');
const db = {
	rate_collection_name: 'rate_ObmenkaKharkovUa',
	rate_id_from_collection: 'last_rate',
	rate_opt_id_from_collection: 'last_rate_opt',
	db: require(path.join(process.env.DIR, "auxmod", 'mongodb')),
	get_subscribers: async function(){
		return [//hard core code, maybe it is from db 
			{
				id: 283404954,//Андрей
				rates_retail: ['USD:UAH', 'EUR:UAH', 'RUB:UAH'],
				rates_opt: []
			},{
				id: -1001381605407,//Канал
				rates_retail: ['USD:UAH', 'EUR:UAH', 'RUB:UAH'],
				rates_opt: []
			}
		]
	},
	default_rates: {
		'USD:UAH': '27.75 27.87',
		'EUR:UAH': '31.95 32.20',
		'RUB:UAH': '0.384 0.389',
		'GBP:UAH': '34.45 35.35',
		'PLN:UAH': '7.00 7.25',
		'CZK:UAH': '1.08 1.20',
		'CHF:UAH': '29.55 30.30',
		'EUR:USD': '1.152 1.158',
		'USD:RUB': '71.71 72.70',
		'GBP:USD': '1.25 1.27'
	},
	get_last_rates_from_db: async function(){
		
		let last_rates = await this.db.find_one({
			collection: this.rate_collection_name,
			find: {_id: this.rate_id_from_collection}
		});

		if(last_rates){
			delete last_rates._id
			return last_rates;
		}

		this.db.delete_one({
			collection: this.rate_collection_name,
			_id: this.rate_id_from_collection
		}).then(
			this.db.update_one({
				collection: this.rate_collection_name,
				_id: this.rate_id_from_collection,
				update: {$set: this.default_rates},
				opt: {upsert: true}
			})
		)

		return this.default_rates;
	},
	last_rates_opt_from_db: async function(){
		let last_rates_opt = await this.db.find_one({
			collection: this.rate_collection_name,
			find: {_id: this.rate_opt_id_from_collection}
		});

		if(last_rates_opt){
			delete last_rates_opt._id
			return last_rates_opt;
		}

		this.db.delete_one({
			collection: this.rate_collection_name,
			_id: this.rate_opt_id_from_collection
		}).then(
			this.db.update_one({
				collection: this.rate_collection_name,
				_id: this.rate_opt_id_from_collection,
				update: {$set: this.default_rates},
				opt: {upsert: true}
			})
		)

		return this.default_rates;
	}
}
const request = {
	url: "https://obmenka.kharkov.ua/",
	headers: qs.parse({
		"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_3 like Mac OS X) AppleWebKit/603.3.8 (KHTML, like Gecko) Mobile/14G60",
		"Cookie": "wujs_rates_is_opt=0;"
		
	}),
	headers_opt: qs.parse({
		"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_3 like Mac OS X) AppleWebKit/603.3.8 (KHTML, like Gecko) Mobile/14G60",
		"Cookie": "wujs_rates_is_opt=1;"
		
	}),
	method: "get",
	data: {},
	params: {},
	request: async function({
		url: url = this.url, 
		headers: headers = this.headers, 
		method: method = this.method,
		data: data = this.data,
		params: params = this.params
	}){
		try {
			return axios({
				url: url,
				method: method,
				headers: headers,
				data: data,
				params: params
			})
		} catch (error) {
			console.error(error);
		}
	},
	request_to_rates: function(){
		return this.request({headers: this.headers})
	},
	request_to_rates_opt: function(){
		return this.request({headers: this.headers_opt})
	},
}
const actual_rates = {
	actual_rates_html: async function(){
		let res = await this.request_to_rates();
		return res.data;
	},
	actual_rates_opt_html: async function(){
		let res = await this.request_to_rates_opt();
		return res.data;
	},
	cheerio_parse_html_to_obj: async function(html){
		//let html = await this.actual_rates_html();
		let $ = cheerio.load(html);//load DOM tree

		let obj = {};

		$('.currencies__block')//filter class
		.each((i, el) => {
			obj[$(".currencies__block-name", el)
				.text()
				.replace(/\//, ':')
				.replace(/Курс/, '')
				.trim()] = 
					$(".currencies__block-buy", el)
					.text()
					.trim() + ' ' + 
					$(".currencies__block-sale", el)
					.text()
					.trim()
				
				// {
				// 	b: $(".currencies__block-buy", el)
				// 		.text()
				// 		.trim(),
				// 	s: $(".currencies__block-sale", el)
				// 		.text()
				// 		.trim()
				// }
			}
		)
		return obj;
	}
}
const changes_rates = {
	rate_parse_str: function(str){
		let [buy, sell] = str.split(' ');
		return {buy: buy, sell: sell};
	},
	magnitude_of_change: function({last, actual}){//определить величину изменения курса

		let decimal_actual_buy = new Decimal(actual.buy)
		let decimal_actual_sell = new Decimal(actual.sell)
		let decimal_last_buy = new Decimal(last.buy)
		let decimal_last_sell = new Decimal(last.sell)

		let buy = last.buy < actual.buy ? decimal_actual_buy.minus(decimal_last_buy): last.buy > actual.buy ? decimal_last_buy.minus(decimal_actual_buy): 0;
		let sell = last.sell < actual.sell ? decimal_actual_sell.minus(decimal_last_sell): last.sell > actual.sell ? decimal_last_sell.minus(decimal_actual_sell): 0;

		return {
			buy: buy,
			sell: sell
		};
	},
	mark: function mark({last, actual}){//определение знака направления
		return last < actual ? '▲': last > actual ? '▼': '●';
	},
	mark_direction: function({last, actual}){//маркировка знака направления
		return {
			buy: this.mark({last: last.buy, actual: actual.buy}),
			sell: this.mark({last: last.sell, actual: actual.sell})
		}
	},
	convert_name_to_emojiname: function(name){

		let matrix = {
			"UAH": '🇺🇦',
			"EUR": '🇪🇺',
			"RUB": '🇷🇺',
			"USD": '🇺🇸',
			"GBP": '🇬🇧',
			"PLN": '🇵🇱',
			"CZK": '🇨🇿',
			"CHF": '🇨🇭'
		}

		let [a,b] = name.split(':');
		
		return matrix[a] + matrix[b];
	},
	changes_rates: async function(){

		let last = await this.get_last_rates_from_db();
		//last = this.default_rates//тест
		
		let actual_html = await this.actual_rates_html();
		let actual = await this.cheerio_parse_html_to_obj(actual_html);
		
		// last['USD:UAH'] = '27.80 28.10';
		// console.log(Object.keys(actual));
		let changes = Object.keys(actual)//нахождение разницы (изменений)
			.filter(key => last[key] !== actual[key]);

		if(!changes.length){//количество изменений
			return [];
		}

		this.db.update_one({//запись в базу актуальных значений
			collection: this.rate_collection_name,
			_id: this.rate_id_from_collection,
			update: {$set: actual},
			opt: {upsert: true}
		});

		changes = changes.map(name => {			
			return {
				name: name,
				emojiname: this.convert_name_to_emojiname(name),
				last: this.rate_parse_str(last[name]),
				actual: this.rate_parse_str(actual[name]),
				direction: this.mark_direction({last: this.rate_parse_str(last[name]), actual: this.rate_parse_str(actual[name])})//,
				//magnitude: this.magnitude_of_change({last: this.rate_parse_str(last[name]), actual: this.rate_parse_str(actual[name])})
			}
		});

		return changes;
	},
	changes_rates_opt: async function(){
		let last = await this.last_rates_opt_from_db();
		//last = this.default_rates//тест

		let actual_html = await this.actual_rates_opt_html();
		let actual = await this.cheerio_parse_html_to_obj(actual_html);
		
		let changes = Object.keys(actual)//нахождение разницы (изменений)
			.filter(key => last[key] !== actual[key]);

		if(!changes.length){//количество изменений
			return [];
		}

		this.db.update_one({//запись в базу актуальных значений
			collection: this.rate_collection_name,
			_id: this.rate_opt_id_from_collection,//опт коллекция
			update: {$set: actual},
			opt: {upsert: true}
		});

		changes = changes.map(name => {			
			return {
				name: name,
				emojiname: this.convert_name_to_emojiname(name),
				last: this.rate_parse_str(last[name]),
				actual: this.rate_parse_str(actual[name]),
				direction: this.mark_direction({last: this.rate_parse_str(last[name]), actual: this.rate_parse_str(actual[name])})//,
				//magnitude: this.magnitude_of_change({last: this.rate_parse_str(last[name]), actual: this.rate_parse_str(actual[name])})
			}
		});

		return changes;
	}
}
const construct_message = {
	construct_message_text: function(obj){
		return `${obj.emojiname} ${obj.actual.buy}${obj.direction.buy} ${obj.actual.sell}${obj.direction.sell}`;
	},
	prepare_inform: async function({subscribers, rates: rates = [], rates_opt: rates_opt = []}){
		let inform = {};

		//rates = d;
		subscribers.forEach(chat => {
			rates.forEach(rate => {
				if(chat.rates_retail.indexOf(rate.name) !== -1){
					if(inform[chat.id]){
						inform[chat.id] += '\n'+this.construct_message_text(rate);
					}else{
						inform[chat.id] = '';
						inform[chat.id] = this.construct_message_text(rate);
					}
					
				}
			});

			if(inform[chat.id]){
				inform[chat.id] += '\n';
			}

			rates_opt.forEach(rate => {
				
				if(chat.rates_opt.indexOf(rate.name) !== -1){
					
					if(inform[chat.id]){
						inform[chat.id] += '\n'+this.construct_message_text(rate);
					}else{
						inform[chat.id] = '';
						inform[chat.id] = this.construct_message_text(rate);
					}
				}
			});
		});

		return inform;
	}
}

module.exports = {
	...db,
	...request,
	...actual_rates,
	...changes_rates,
	...construct_message
}