import config from '../config'
import kue from 'kue'

let queue = null

// start the kue dashboard
export function startJobsDashboard(app) {
	app.use('/kue', kue.app)
}


// creates queue 
export function createQueue() {
	// create the queue
	queue = kue.createQueue({ redis: { ...config.redis } })
	queue.watchStuckJobs(1000 * 10)
}



