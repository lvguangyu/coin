const hbsdk = require('./sdk/hbsdk');
let price = '';
let buyPrice = '';
let sellPrice = '';
let coefficient = 0.00251;
let usdtCount = '';
let eosCount = '';
const amount = 1;
const symbol = 'eosusdt';
const Decimal = require('decimal.js');
const log4js = require("log4js");
log4js.configure({
    appenders: { log_file: { type: 'file', filename: "./logs/log_file/file.log", "maxLogSize": 104800, "backups": 100} },
    categories: { default: { appenders: ['log_file'], level: 'ALL' } }
});
let LogFile = log4js.getLogger('log_file');
// 按注释的步骤逐步放开注释，运行程序，验证接口
function run() {
    LogFile.info('123');
    // let resTrade = hbsdk.get_trade(symbol);
    // if(resTrade.status === 'ok'){
    //     if(resTrade && resTrade.tick && resTrade.tick.data && resTrade.tick.data[0] && resTrade.tick.data[0].price){
    //         price = resTrade.tick.data[0].price;
    //         buyPrice = new Decimal(price).sub(new Decimal(price).mul(new Decimal(coefficient))).toNumber().toFixed(4);
    //         sellPrice = new Decimal(price).sub(new Decimal(price).add(new Decimal(coefficient))).toNumber().toFixed(4);
    //         LogFile.info('当前价格：'+price+'USDT，购买价格：'+buyPrice+'USDT,卖出价格：'+sellPrice+'USDT.');
    //         let buyResult = buyCoin(symbol,amount, buyPrice);
    //         LogFile.info('购买'+symbol+'：'+buyPrice+'，购买数量：'+buyPrice+'.购买状态：'+JSON.stringify(buyResult));
    //         // let buyResult = { status: 'ok', data: '3781495303' };
    //         if(buyResult.status === 'ok' ){
    //             let flag = checkOrderState('购买', buyResult.data);
    //             if(flag){
    //                 let userBlance = getUserBalance();
    //                 eosCount = getEosCount(userBlance);
    //                 LogFile.info('购买'+symbol+'：'+buyPrice+'，购买数量：'+buyPrice+'.购买状态：'+JSON.stringify(buyResult));
    //                 let sellResult = sellCoin(symbol, eosCount, sellPrice);
    //                 // let sellResult = { status: 'ok', data: '3783364214' };
    //                 let flag1 = checkOrderState('出售', sellResult.data);
    //                 if(flag1){
    //                     run();
    //                 }
    //             }
    //         }else{
    //             run();
    //         }
    //     }else{
    //         run();
    //     }
    // }

}
function sellCoin(symbol, eosCount, sellPrice){
    let sellResult = null;
    let flag = true;
    while(flag){
        sellResult = hbsdk.sell_limit(symbol, eosCount, sellPrice);
        if(sellResult && sellResult.status === 'ok'){
            flag = false;
        }
        pausecomp(500);
    }
    return sellResult;
}
function buyCoin(symbol,amount, buyPrice){
    let buyResult = null;
    let flag = true;
    while(flag){
        buyResult = hbsdk.buy_limit(symbol,amount, buyPrice);
        if(buyResult && buyResult.status === 'ok'){
            flag = false;
        }
        pausecomp(500);
    }
    return buyResult;
}
function getUserBalance(){
    let userBlance = null;
    let flag = true;
    while(flag){
        console.log('请求balance');
        userBlance = hbsdk.get_balance();
        if(userBlance && userBlance.status === 'ok'){
            flag = false;
        }
        pausecomp(500);
    }
    usdtCount = getUsdtCount(userBlance);
    console.log(usdtCount);
    LogFile.info('获取用户状态：成功。当前拥有USDT---' + usdtCount);
    return userBlance;
}
function checkOrderState (msg, id) {
    let flag = true;
    while (flag) {
        let res = hbsdk.get_order(id);

        if(res.state === 'filled') {
            LogFile.info(msg + '状态：成功。'+JSON.stringify(res));
            flag = false;
            return true;
        }else{
            LogFile.info(msg + '状态：未成功。'+JSON.stringify(res));
        }
        pausecomp(500);
    }
}

function getUsdtCount (userBlance) {
    let blanceList = userBlance.data.list;
    let count = 0;
    for(let i = 0; i< blanceList.length; i++){
        if(blanceList[i].currency === 'usdt' && blanceList[i].type === 'trade') {
            count = blanceList[i].balance;
        }
    }
    return count;
}
function getEosCount (userBlance) {
    let blanceList = userBlance.data.list;
    let count = 0;
    for(let i = 0; i< blanceList.length; i++){
        if(blanceList[i].currency === 'eos' && blanceList[i].type === 'trade'){
            count = blanceList[i].balance;
        }
    }
    return count;
}
function pausecomp(millis)
{
    let date = new Date();
    let curDate = null;
    do { curDate = new Date(); }
    while(curDate-date < millis);
}
run();