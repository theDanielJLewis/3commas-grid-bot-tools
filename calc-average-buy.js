import 'dotenv/config';
import _ from 'lodash';
import got from 'got';
import generateSignature from './generate-signature.js';
const argv = yargs(hideBin(process.argv)).argv
import inquirer from 'inquirer'

const baseUrl = 'https://api.3commas.io/public/api';

var gotOptions = {
    headers: {
        apikey: process.env.API_KEY
    },
    resolveBodyOnly: true,
    responseType: 'json'
}
var gridBotsUrl = baseUrl + `/ver1/grid_bots`;

gotOptions.headers.signature = generateSignature(gridBotsUrl);
var gridBots = await got(gridBotsUrl, gotOptions);
_.forEach(gridBots, bot => {
    bot.name = `${bot.name} | ${bot.pair}`;
    bot.value = bot.id;
})
inquirer
  .prompt([
    { 
        type: 'list',
        name: 'id',
        choices: gridBots,
    }
  ])
  .then((answers) => {
    calcAverageBuy(answers.id);
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  });

async function calcAverageBuy(gridBotId) {
    var gridBotInfo = baseUrl + `/ver1/grid_bots/${gridBotId}`;
    var gridMarketOrdersUrl = baseUrl + `/ver1/grid_bots/${gridBotId}/market_orders`;

    try {
        gotOptions.headers.signature = generateSignature(gridBotInfo);
        var gridInfo = await got(gridBotInfo, gotOptions);
        gotOptions.headers.signature = generateSignature(gridMarketOrdersUrl);
        var gridOrders = await got(gridMarketOrdersUrl, gotOptions);
        
        var orders = _.concat(gridOrders.grid_lines_orders, gridOrders.balancing_orders);
        _.remove(orders, order => {
            return order.status_string != 'Filled';
        });
        
        _.forEach(orders, order => {
            order.quantity = _.toNumber(order.quantity);
            order.total = _.toNumber(order.total);
            // order.quantity_remaining = _.toNumber(order.quantity_remaining);
            // order.rate = _.toNumber(order.rate);
            // order.average_price = _.toNumber(order.average_price);
            // order.created_at = new Date(order.created_at);
            // order.updated_at = new Date(order.updated_at);
            delete order.created_at;
            delete order.updated_at;
            delete order.order_id;
            // delete order.status_string;
            delete order.quantity_remaining;
            delete order.rate;
            delete order.average_price;
            if (order.order_type == "SELL") {
                order.quantity = -order.quantity;
                order.total = -order.total;
            }
            // delete order.order_type;
        });
        // console.log(orders);
        var totalQty = _.sumBy(orders, 'quantity');
        var totalCost = _.sumBy(orders, 'total');
        var averageBuy = totalCost / totalQty;
        var result = {
            // name: gridInfo.name,
            // pair: gridInfo.pair,
            totalQty,
            totalCost,
            averageBuy
        }
        console.log(`Purchased quantity: ${totalQty}`);
        console.log(`Total cost: ${totalCost}`);
        console.log(`Average buy: ${averageBuy}`);
    } catch (error) {
        console.error(error.message);
    }
}
