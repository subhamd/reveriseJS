import dbc from '../db'
import Promise from 'bluebird'
import kue from 'kue'

app.use('/jobs', kue.app)

export default function phraseManager() {


	return {
		submitJob(collection, payload) {
			
		}
	}

}