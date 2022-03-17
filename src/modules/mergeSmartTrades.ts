import _ from 'lodash';
import inquirer from 'inquirer';
import queryString from 'query-string';
import dayjs from 'dayjs';
import api from './3c-api';
// import createSmartTrade from './createSmartTrade';

async function start() {
	let smartTrades = await api.getSmartTradeHistory({
		status: 'active',
		per_page: 100,
	});
	// console.log(smartTrades[0]);
	// console.log('Total smart trades', smartTrades.length);
	let filtered = {};
	_.chain(smartTrades)
		.filter(
			(trade) =>
				_.filter(
					smartTrades,
					(t) =>
						trade.pair === t.pair &&
						trade.account.id === t.account.id
				).length > 1
		)
		.groupBy((trade) => trade.account.id)
		.forEach((account, key) => {
			filtered[key] = _.groupBy(account, (trade) => trade.pair);
		})
		.value();

	const accounts = _.map(filtered, (account, key) => {
		let value = Number(key);
		let sampled = _.sample(account);
		let name = sampled[0].account.name;
		return {
			name,
			value,
		};
	});

	const { account } = await inquirer.prompt([
		{
			message: 'Pick from these accounts with similar Smart Trades:',
			name: 'account',
			type: 'list',
			choices: accounts,
		},
	]);
	const { pair } = await inquirer.prompt([
		{
			message: 'Pick from these pairs with similar Smart Trades',
			name: 'pair',
			type: 'list',
			choices: getPairs(filtered[account]),
		},
	]);
	const trades = filtered[account][pair];

	let purchasedQuantity = 0;
	let totalInvestment = 0;

	_.map(trades, (trade) => {
		const { units, price, total } = trade.position;
		purchasedQuantity += Number(units.value);
		totalInvestment += Number(total.value);
		console.log(
			`Quantity: ${units.value} | Value: ${
				total.value
			} | Average price: ${Number(price.value)}`
		);
	});

	let tradeValues = {
		purchasedQuantity,
		totalInvestment,
		averageBuyPrice: totalInvestment / purchasedQuantity,
	};

	const { answer: shouldMergeSmartTrades } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'answer',
			message: 'Cancel these smart trades and merge into one?',
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
	if (shouldMergeSmartTrades) {
		// convertToSmartTrade({ id: gridBot.id, ...results });
	}
}

export default start;

function getPairs(data) {
	return _.map(data, (pair, key) => {
		return {
			value: key,
		};
	});
}

function calcAverageBuy(data, account, pair) {
	let totalInvestment = _.chain(data['Binance US']['USD_ALGO'])
		// .forEach((trade) => console.log(trade.position))
		.sumBy((trade) => Number(trade.position.total.value))
		.value();

	let purchasedQuantity = _.chain(data['Binance US']['USD_ALGO'])
		// .forEach((trade) => console.log(trade.position))
		.sumBy((trade) => Number(trade.position.units.value))
		.value();

	let averageBuyPrice = totalInvestment / purchasedQuantity;
	let result = {
		purchasedQuantity,
		totalInvestment,
		averageBuyPrice,
	};
	console.log(result);
	return result;
}

// start();
