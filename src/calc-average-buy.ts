import 'dotenv/config';
import _ from 'lodash';
// import got from 'got';
// import generateSignature from './generate-signature.js';
import inquirer from 'inquirer';
import { API } from '3commas-typescript';
import queryString from 'query-string';
import dayjs from 'dayjs';

const api = new API({
	key: process.env.API_KEY, // Optional if only query endpoints with no security requirement
	secrets: process.env.API_SECRET, // Optional
	timeout: 60000, // Optional, in ms, default to 30000
	forcedMode: 'real',
	errorHandler: (response, reject) => {
		// Optional, Custom handler for 3Commas error
		const { error, error_description } = response;
		reject(new Error(error_description ?? error));
	},
});

async function getGridBots(options) {
	options.limit = 100;
	if (!options.state) delete options.state;
	const optionsString = queryString.stringify(options);

	try {
		var gridBots = await api.customRequest(
			'GET',
			1,
			`/grid_bots?${optionsString}`
		);
		_.forEach(gridBots, (bot) => {
			bot.name = `${bot.name} | ${bot.pair} | Updated ${bot.updated_at}`;
			bot.value = bot.id;
		});
		return gridBots;
	} catch (error) {
		console.error(error);
	}
}

function getGridBot(id) {
	return api.customRequest('GET', 1, `/grid_bots/${id}`);
}

async function calcAverageBuy(gridBotId) {
	try {
		var gridInfo = await getGridBot(gridBotId);

		var gridOrders = await api.customRequest(
			'GET',
			1,
			`/grid_bots/${gridBotId}/market_orders`
		);
		// console.log(gridOrders);

		var orders = _.concat(
			gridOrders.grid_lines_orders,
			gridOrders.balancing_orders
		);
		_.remove(orders, (order) => {
			return (
				dayjs(order.created_at).isBefore(gridInfo.updated_at) ||
				order.status_string != 'Filled'
			);
		});
		if (orders.length === 0) return;

		_.forEach(orders, (order) => {
			order.quantity = _.toNumber(order.quantity);
			order.total = _.toNumber(order.total);
			// order.quantity_remaining = _.toNumber(order.quantity_remaining);
			// order.rate = _.toNumber(order.rate);
			// order.average_price = _.toNumber(order.average_price);
			// order.created_at = new Date(order.created_at);
			// order.updated_at = new Date(order.updated_at);
			order.created_at = new Date(order.created_at);
			delete order.updated_at;
			delete order.order_id;
			// delete order.status_string;
			delete order.quantity_remaining;
			delete order.rate;
			delete order.average_price;
			if (order.order_type == 'SELL') {
				order.quantity = -order.quantity;
				order.total = -order.total;
			}
			// delete order.order_type;
		});
		// console.log(orders);
		var ownedQuantity = _.sumBy(orders, 'quantity');
		var totalInvestment = _.sumBy(orders, 'total');
		// var totalInvestment = _.sumBy(orders, 'total') + _.toNumber(gridInfo.current_profit);
		var averageBuyPrice = totalInvestment / ownedQuantity;
		var result = {
			// name: gridInfo.name,
			// pair: gridInfo.pair,
			ownedQuantity,
			totalInvestment,
			averageBuyPrice,
		};
		return result;
	} catch (error) {
		console.error(error.message);
	}
}

async function start() {
	let options = await inquirer.prompt([
		{
			type: 'list',
			name: 'state',
			message: 'Pick which bots to select from:',
			choices: [
				{ name: 'All bots', value: false },
				{ name: 'Enabled only', value: 'enabled' },
				{ name: 'Disabled only', value: 'disabled' },
			],
		},
	]);

	const gridBot = await inquirer.prompt([
		{
			type: 'list',
			name: 'id',
			message: 'Pick your grid bot:',
			pageSize: 10,
			choices: await getGridBots(options),
		},
	]);
	console.log(gridBot);
	const results = await calcAverageBuy(gridBot.id);
	if (results) {
		console.log(results);

		// Prompt to conver to Smart Trade
		const shouldConvertToSmartTrade = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'answer',
				message: 'Stop and convert this Grid Bot into a Smart Trade?',
				default: false,
			},
			{
				type: 'confirm',
				name: 'confirmation',
				message: 'Are you sure?',
				default: false,
				when(answers) {
					return answers.answer === true;
				},
			},
		]);
		if (shouldConvertToSmartTrade)
			convertToSmartTrade({ id: gridBot.id, ...results });
	} else {
		console.log('No filled orders since updating');
	}
}

start();

async function convertToSmartTrade(input) {
	let gridBot = await getGridBot(input.id);
	gridBot = _.merge(gridBot, input);
	console.log(gridBot);
	let result = await api.smartTrade({
		account_id: gridBot.account_id,
		pair: gridBot.pair,
		skip_enter_step: true,
		position: {
			type: 'sell',
			order_type: 'limit',
			units: {
				value: 1,
			},
			price: {
				value: gridBot.averageBuyPrice,
			},
		},
	});
	console.log(result);
}
