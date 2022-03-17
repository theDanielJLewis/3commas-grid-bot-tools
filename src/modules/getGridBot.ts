import api from './3c-api';

function getGridBot(id) {
	return api.customRequest('GET', 1, `/grid_bots/${id}`);
}

export default getGridBot;
