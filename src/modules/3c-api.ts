import 'dotenv/config';
import { API } from '3commas-typescript';

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

export default api;
