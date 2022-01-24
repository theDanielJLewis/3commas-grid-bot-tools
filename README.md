A simple script for running calculations on 3commas grid bots.

# Installation

1. Clone the repository to your system.
2. Navigate into the project folder
3. Rename `.env-sample` to `.env` and add your 3commas API key and secret
4. Run `npm i`.

## Usage

Currently, this only supports a rough average buy calculator for grid bots, allowing you to more easily switch from a grid bot to a smart trade.

```bash
npm start
```

Choose the bot you want to calculate and you'll be given the purchased quantity, total cost, and average buy price.