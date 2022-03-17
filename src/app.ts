import inquirer from 'inquirer';
import calcAverageGridBuy from './modules/calcAverageGridBuy';
import mergeSmartTrades from './modules/mergeSmartTrades';

async function start() {
	const { run } = await inquirer.prompt([
		{
			message: 'What would you like to do?',
			name: 'run',
			type: 'list',
			choices: [
				{
					name: "Calculate grid bot's average buy price and optionally convert to smart trade",
					value: calcAverageGridBuy,
				},
				{
					name: 'Merge two or more smart trades',
					value: mergeSmartTrades,
				},
			],
		},
	]);
	run();
}
start();
