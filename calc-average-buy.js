import 'dotenv/config';
import _ from 'lodash';
import got from 'got';
import generateSignature from './generate-signature.js';
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
const argv = yargs(hideBin(process.argv)).argv

const baseUrl = 'https://api.3commas.io/public/api';

var gridBotId = argv.id;

var url = baseUrl + `/ver1/grid_bots/${gridBotId}/market_orders`;

var gotOptions = {
    headers: {
        apikey: process.env.API_KEY,
        signature: generateSignature(url)
    },
    responseType: 'json'
}

try {
    var {body} = await got(url, gotOptions);
    
    var orders = _.concat(body.grid_lines_orders, body.balancing_orders);
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
        totalQty,
        totalCost,
        averageBuy
    }
    console.log(result);
} catch (error) {
    console.error(error.message);
}