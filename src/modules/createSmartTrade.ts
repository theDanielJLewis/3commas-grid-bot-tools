import inquirer from 'inquirer';
import _ from 'lodash';
import api from './3c-api';
import getGridBot from './getGridBot';

async function createSmartTrade(input) {
	let gridBot = await getGridBot(input.id);
	await api.customRequest('POST', 1, `/grid_bots/${input.id}/disable`);
	gridBot = _.merge(gridBot, input);

	let newSmartTrade = await api.smartTrade({
		account_id: gridBot.account_id,
		pair: gridBot.pair,
		skip_enter_step: true,
		position: {
			type: 'buy',
			order_type: 'limit',
			units: {
				value: gridBot.purchasedQuantity,
			},
			price: {
				value: gridBot.averageBuyPrice,
			},
		},
		take_profit: {
			enabled: false,
		},
		stop_loss: {
			enabled: false,
		},
		note: `Averaged from ${gridBot.name} (${gridBot.id})`,
	});
	console.log(
		`${gridBot.name} disabled and Smart Trade ${newSmartTrade.id} created`
	);
	const doAnother = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'answer',
			message: 'Would you like to check another grid bot?',
			default: true,
		},
	]);
	if (doAnother === true) start();
	process.exit();
}

export default createSmartTrade;
