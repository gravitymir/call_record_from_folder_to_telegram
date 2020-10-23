const path = require('path');

const db = {
    collection_name: 'promuabot_subscribers',
    db: require(path.join(process.env.DIR, "auxmod", 'mongodb')),
    get_subscribers_from_db: async function () {
        return this.db.find({ collection: this.collection_name })
    },
    get_one_subscriber_from_db: async function (_id) {
        return this.db.find_one({
            collection: this.collection_name,
            find: {_id: _id}
        })
    },
    update_subscriber_to_db: async function (subscriber) {
        let _id = subscriber._id;
        delete subscriber._id;

        return this.db.update_one({
            collection: this.collection_name,
            _id: _id || subscriber.id,
            update: {
                $set: subscriber
            }, opt: {
                upsert: true
            }
        });
    }
}
const request = {
    axios: require('axios'),
    //url: "https://my.prom.ua/cabinet/export_orders/xml/983997?hash_tag=1b8c245dbe13345dab0053fb404ce363",
    request: async function (url) {
        try {
            //status, statusText, headers, config, request, data
            let res = await this.axios({
                url: url,
                method: "get",
                headers: {},
                data: '',
                params: {}
            });
            return res.data;
        } catch (err) {
            //config, request, response, isAxiosError, toJSON
            console.log(err.toJSON());
            return false;
        }
    },
    get_orders_from_platform: async function (url) {
        let resp = await this.request(url);

        if (resp === false) {
            return false;
        }

        let obj = await this.parse(resp);
        return obj.orders.order;
    }
}
const xml_parser = {
    xml_parser: new require('xml2js').Parser({
        explicitArray: false,
        emptyTag: false,
        mergeAttrs: true
    }).parseString,
    parse: async function parse(xml) {
        return new Promise((resolve, reject) => {
            this.xml_parser(xml, function (err, obj) {
                if (!err) {
                    resolve(obj)
                } else {
                    reject(err)
                }
            });
        });
    }
}
const perse_order = {
    perse_order_to_message_text: function ({ order, platform_name }) {
        let s = {
            id: "id",
            state: "state",
            name: "name",
            phone: "phone",
            email: "email",
            date: "date",
            address: "address",
            paymentType: "paymentType",
            deliveryType: "deliveryType",
            novaPoshtaTTN: "novaPoshtaTTN",
            priceUAH: "priceUAH",
            discountedPriceUAH: "discountedPriceUAH",
            source: "source",
            items: "[items]"
        }

        let items = Array.isArray(order.items.item) ? order.items.item : [order.items.item];

        items = items.map(i => {
            return `<a href='https://my.${platform_name}/cms/product/edit/${i.id}'>✏</a> ${i.name}\n` +
                //`${t.sku ? t.sku + '\n': ''}` +
                `<a href='${i.url}'>🔎</a> ${parseInt(i.quantity)} * ${parseInt(i.price)} = ${parseInt(i.quantity) * parseInt(i.price)} ${i.currency}`
        })

        return `<a href='https://my.${platform_name}/cms/order/edit/${order.id}'>#⃣ ${order.id} 🔗</a>\n` +
            (order.source ? `📯 <code>${order.source}</code>\n` : '') +
            (order.name ? `👤 <code>${order.name}</code>\n` : '') +
            (order.phone ? `📞 ${order.phone}\n` : '') +
            (order.email ? `📧 <code>${order.email}</code>\n` : '') +
            (order.paymentType ? `💵 <code>${order.paymentType}</code>\n` : '') +
            (order.deliveryType ? `🚚 <code>${order.deliveryType}</code>\n` : '') +
            (order.address ? `🏠 <code>${order.address}</code>\n` : '') +
            (order.index ? `📮 <code>${order.index}</code>\n` : '') +
            (order.novaPoshtaTTN ? `📦 <code>${order.novaPoshtaTTN}</code>\n` : '') +
            (items ? `<code>${items.join('</code>\n<code>')}</code>\n` : '') +
            //priceUAH заменить на портальную валюту страны!
            (order.priceUAH ? `💰 <code>${parseInt(order.priceUAH)}</code>\n` : '') +
            (order.payercomment ? `💬 <code>${order.payercomment}</code>\n` : '')

        //`👤 ${order.manager ? order.manager: '-'}\n` +
        //`💸 ${order.call_cost ? order.call_cost.price + ' ' + order.call_cost.currency: '-'}\n` +
        //`${order.call_cost ? order.call_cost.description.replace(' - Mobile', ' 📱') + '\n': ''}` +
        //`📮 ${order.index ? "<a href='"+ order.index.url+"'>🔗</a> <code>" + order.index.index + "</code> " + order.index.settlement + " " + order.index.status + " " + order.index.address: "-"}\n` +

    },
    prepare_order_to_message_media: function ({ order, platform_name }) {
        if (Array.isArray(order.items)) {//несколько товаров в заказе
            return {
                method: "sendMediaGroup",
                media: order.items.map(
                    (order, i) => i < 10 &&
                    {
                        'media': { url: order.item.image },
                        'caption': order.item.name + ' ' + parseInt(order.item.quantity) + ' шт',
                        'type': 'photo'
                    }).filter(i => i && i),
                caption: this.perse_order_to_message_text({ order, platform_name }),
                opt: {
                    disable_notification: false,
                    disable_web_page_preview: true,
                    parse_mode: 'HTML'
                }
            }
        } else {//один товар в заказе
            return {
                method: "sendPhoto",
                url: order.items.item.image,
                caption: this.perse_order_to_message_text({ order, platform_name }),//order.items.item.name + ' ' + parseInt(order.items.item.quantity) + ' шт'
                opt: {
                    disable_notification: false,
                    disable_web_page_preview: true,
                    parse_mode: 'HTML'
                }
            }
        }
    }
}
module.exports = {
    ...request,
    ...xml_parser,
    ...db,
    ...perse_order
}