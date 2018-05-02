let config = require('config');
let CryptoJS = require('crypto-js');
let Promise = require('bluebird');
let moment = require('moment');
let HmacSHA256 = require('crypto-js/hmac-sha256')
let http = require('../framework/httpClient');
let request = require('sync-request');

const URL_HUOBI_PRO = 'api.huobipro.com';
// const URL_HUOBI_PRO = 'api.huobi.pro'; //备用地址

const DEFAULT_HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36"
}

function get_auth() {
    let sign = config.huobi.trade_password + 'hello, moto';
    let md5 = CryptoJS.MD5(sign).toString().toLowerCase();
    let ret = encodeURIComponent(JSON.stringify({
        assetPwd: md5
    }));
    return ret;
}

function sign_sha(method, baseurl, path, data) {
    let pars = [];
    for (let item in data) {
        pars.push(item + "=" + encodeURIComponent(data[item]));
    }
    let p = pars.sort().join("&");
    let meta = [method, baseurl, path, p].join('\n');
    // console.log(meta);
    let hash = HmacSHA256(meta, config.huobi.secretkey);
    let Signature = encodeURIComponent(CryptoJS.enc.Base64.stringify(hash));
    // console.log(`Signature: ${Signature}`);
    p += `&Signature=${Signature}`;
    // console.log(p);
    return p;
}

function get_body() {
    return {
        AccessKeyId: config.huobi.access_key,
        SignatureMethod: "HmacSHA256",
        SignatureVersion: 2,
        Timestamp: moment.utc().format('YYYY-MM-DDTHH:mm:ss'),
    };
}

function call_api(method, path, payload, body) {
    let account_id = config.huobi.account_id_pro;
    let url = `https://${URL_HUOBI_PRO}${path}?${payload}`;
    console.log(url);
    let headers = DEFAULT_HEADERS;
    headers.AuthData = get_auth();

    if(method === 'GET') {
        let res = request('GET', url, {
            timeout: 5000,
            headers: headers
        });
        let json = JSON.parse(res.getBody().toString());
        if (json.status === 'ok') {
            return json;
        } else {
            console.log('调用错误', json);
            return null;
        }
    }else{
        let res = request('POST', url, {
            timeout: 5000,
            headers: headers,
            body:JSON.stringify(body)
        });
        let json = JSON.parse(res.getBody().toString());
        if (json.status === 'ok') {
            return json;
        } else {
            console.log('调用错误', json);
            return null;
        }
    }


    // return new Promise(resolve => {
    //     let account_id = config.huobi.account_id_pro;
    //     let url = `https://${URL_HUOBI_PRO}${path}?${payload}`;
    //     console.log(url);
    //     let headers = DEFAULT_HEADERS;
    //     headers.AuthData = get_auth();
    //
    //     if (method == 'GET') {
    //         let res = request('GET', url, {
    //                 timeout: 1000,
    //                 headers: headers
    //             });
    //         console.log(res.getBody().toString());
    //         // http.get(url, {
    //         //     timeout: 1000,
    //         //     headers: headers
    //         // }).then(data => {
    //         //     let json = JSON.parse(data);
    //         //     if (json.status == 'ok') {
    //         //         resolve(json);
    //         //     } else {
    //         //         console.log('调用错误', json);
    //         //         resolve(null);
    //         //     }
    //         // }).catch(ex => {
    //         //     console.log(method, path, '异常', ex);
    //         //     resolve(null);
    //         // });
    //     } else if (method == 'POST') {
    //         // http.post(url, body, {
    //         //     timeout: 1000,
    //         //     headers: headers
    //         // }).then(data => {
    //         //     let json = JSON.parse(data);
    //             if (json.status == 'ok') {
    //                 resolve(json);
    //             } else {
    //                 console.log('调用错误', json);
    //                 resolve(null);
    //             }
    //         // }).catch(ex => {
    //         //     console.log(method, path, '异常', ex);
    //         //     resolve(null);
    //         // });
    //     }
    // });
}

let HUOBI_PRO = {
    get_account: function() {
        let path = `/v1/account/accounts`;
        let body = get_body();
        let payload = sign_sha('GET', URL_HUOBI_PRO, path, body);
        return call_api('GET', path, payload, body);
    },
    get_trade: function(symbol) {
        let path = `/market/trade`;
        let body = get_body();
        body.symbol = symbol;
        let payload = sign_sha('GET', URL_HUOBI_PRO, path, body);
        return call_api('GET', path, payload, body);
    },
    get_balance: function() {
        let account_id = config.huobi.account_id_pro;
        let path = `/v1/account/accounts/${account_id}/balance`;
        let body = get_body();
        let payload = sign_sha('GET', URL_HUOBI_PRO, path, body);
        return call_api('GET', path, payload, body);
    },
    get_open_orders: function(symbol) {
        let path = `/v1/order/orders`;
        let body = get_body();
        body.symbol = symbol;
        body.states = 'submitted,partial-filled';
        let payload = sign_sha('GET', URL_HUOBI_PRO, path, body);
        return call_api('GET', path, payload, body);
    },
    get_order: function(order_id) {
        let path = `/v1/order/orders/${order_id}`;
        let body = get_body();
        let payload = sign_sha('GET', URL_HUOBI_PRO, path, body);
        return call_api('GET', path, payload, body);
    },
    buy_limit: function(symbol, amount, price) {
        let path = '/v1/order/orders/place';
        let body = get_body();
        let payload = sign_sha('POST', URL_HUOBI_PRO, path, body);

        body["account-id"] = config.huobi.account_id_pro;
        body.type = "buy-limit";
        body.amount = amount;
        body.symbol = symbol;
        body.price = price;

        return call_api('POST', path, payload, body);
    },
    sell_limit: function(symbol, amount, price) {
        let path = '/v1/order/orders/place';
        let body = get_body();
        let payload = sign_sha('POST', URL_HUOBI_PRO, path, body);

        body["account-id"] = config.huobi.account_id_pro;
        body.type = "sell-limit";
        body.amount = amount;
        body.symbol = symbol;
        body.price = price;

        return call_api('POST', path, payload, body);
    },
    withdrawal: function(address, coin, amount, payment_id) {
        let path = `/v1/dw/withdraw/api/create`;
        let body = get_body();
        let payload = sign_sha('POST', URL_HUOBI_PRO, path, body);

        body.address = address;
        body.amount = amount;
        body.currency = coin;
        if (coin.toLowerCase() == 'xrp') {
            if (payment_id) {
                body['addr-tag'] = payment_id;
            } else {
                console.log('huobi withdrawal', coin, 'no payment id provided, cancel withdrawal');
                return Promise.resolve(null);
            }
        }

        return call_api('POST', path, payload, body);
    }
}

module.exports = HUOBI_PRO;