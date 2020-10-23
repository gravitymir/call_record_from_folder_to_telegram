const path = require('path');
const express = require('express');
const router = express.Router();
const moment = require('moment');
moment.locale("ru");

function JSON_validator(str_json){
    //LOG_FUNC(arguments, __filename);
    let obj_json = null;

    if (/^[\],:{}\s]*$/.test(str_json.replace(/\\["\\\/bfnrtu]/g, '@').
            replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
            replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
                obj_json = JSON.parse(str_json);
        }
    return obj_json;
}

router.get('/', function(req, res) {
    let ipv4 = req.headers['x-forwarded-for'] || req.connection.remoteAddress.split(`:`).pop();

    if(!ipv4 || !req.query || typeof req.query !== 'object' || !req.query.check_arm) return res.end();
    
    let obj = JSON_validator(req.query.check_arm);
    obj.server_time = moment().format('HH:mm:ss');
    obj.ipv4 = ipv4;

    if(!global.EQ_OBJ){
        global.EQ_OBJ = {};
    }else{
        
        if(global.EQ_OBJ[obj._id].ipv4 !== ipv4){
            console.log(`${String(moment().format('DD HH:mm:ss')).green} смена ip ${String(global.EQ_OBJ[obj._id].ipv4).green} => ${String(ipv4).green}`);
        }
    }

    global.EQ_OBJ[obj._id] = Object.assign(
        obj,
        {
            check_time: moment().unix()// * 1000,
        }
    );
    
    global.cron_equipment_check = require(path.join(global.DIR, 'auxmod', 'cron', 'equipment_check'));
    global.cron_equipment_check.start();
    
    res.json(obj);

    res.end();
    // console.log(global.EQ_OBJ);
    // console.log(moment(moment().unix() * 1000).format('YYYY MM DD HH mm ss'));
});

module.exports = router;
