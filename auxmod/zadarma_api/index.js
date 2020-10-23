const axios = require('axios');
// const dateFns = require('date-fns');
// const querystring = require('querystring');
const crypto = require('crypto');
const userKey = process.env.ZADARMA_USER_KEY;
const secretKey = process.env.ZADARMA_SECRET_KEY;

// const today = new Date();
// const endOfDay = dateFns.endOfDay(today);
// const startOfDay = dateFns.startOfDay(today);

// const inspect = require('util').inspect;

module.exports = {
    defaultPhoneNumberFrom: '',
    setDefaultPhoneNumberFrom: function(phoneNumber){
        this.defaultPhoneNumberFrom = phoneNumber;
    },
    prepare: function({method, params}){
        let paramsStr = Object.keys(params)
            .sort((a, b) => a === b ? 0 : a > b ? 1 : -1)
            .map(key => `${key}=${encodeURI(params[key])}`)
            .join('&');
    
        let md5 = crypto.createHash('md5').update(paramsStr).digest('hex');
        let hex = crypto.createHmac('sha1', secretKey)
            .update(method + paramsStr + md5)
            .digest('hex');
        let sign = Buffer.from(hex).toString('base64');
        return {
            headers: {Authorization: `${userKey}:${sign}`},
            url: `${method}?${paramsStr}`
        }
    },
    request: async function({method, params = ''}){
        let {url, headers} = this.prepare({
            method: method,
            params: params
        });
    
        return axios({
            url: url,
            baseURL: 'https://api.zadarma.com',
            headers: headers
        });
    },
    getCallPrice: async function(...args){
        if(!args.length || (!args[0].to || (!args[0].from && !this.defaultPhoneNumberFrom))){

            return console.error("Error: need price({from: 'xxxxxxxxxx', to: 'xxxxxxxxxx'}) or api.setDefaultPhoneNumberFrom('xxxxxxxxxx')");
        }
        
        let {from, to} = args.shift();

        // :-) set default phone numbers
        //let {from: from = '73919100000', to: to = '67200000000'} = args.shift();

        from = from || this.defaultPhoneNumberFrom;

        let res = await this.request({
            method: '/v1/info/price/',
            params: {
                number: to.replace(/^\+/, ''),
                caller_id: from.replace(/^\+/, '')
            }
        });
        return res.data;
    },
    getAccountBalance: async function(){
        let res = await this.request({method: '/v1/info/balance/'});
        return res.data;
    },
    sip: async function(){
        let res = await this.request({method: '/v1/sip/'});
        return res.data;
    },
    direct_numbers: async function(){
        let res = await this.request({method: '/v1/direct_numbers/'});
        return res.data;
    },
    redirection: async function(){
        let res = await this.equest({method: '/v1/sip/redirection/'});
        return res.data;
    },
    internal: async function(){
        let res = await this.request({method: '/v1/pbx/internal/'});
        return res.data;
    },
    sip_status: async function(number){
        let res = await this.request({method: '/v1/pbx/internal/' + number + '/status/'});
        return res.data;
    },
    getRecordFileUrl: async function({pbx_call_id}){
        let res = await this.request({
            method: '/v1/pbx/record/request/',
            params: {
                pbx_call_id: pbx_call_id,
                lifetime : 7200
            }
        });
        return res.data.links[0] ? res.data.links[0]: res.data.link;
    }
}