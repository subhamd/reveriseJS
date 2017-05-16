import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/interval'
import { objForEach, now } from './utils'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'

// scan the processed nodes and find out the new or changed nodes and emit 
export function getPushStream(dictionary, processedNodes, processedAttrs, settings) {
	let busy = false,
		intervalId = null,
		num_nodes = 0
	
	let enterBusy = () => busy = true
	let exitBusy = () => busy = false

	if(!dictionary.ids) dictionary.ids = []
	if(!dictionary.entries) dictionary.entries = {}

	let submitted_node_ids      = dictionary.ids
	let obs_dictionary_entries  = dictionary.entries
	
	function pickReqData(key, val, req_body) {
		if(val.ref.__revloc__.is_new) {
		   val.ref.__revloc__.is_new = false
		  
		  let _id = nodeId(val.ref, val.ref.__revloc__.value),
		    _pos = nodePos(val.ref);

		  if(!_id || val.ref.nodeValue.trim() === '' || submitted_node_ids[_id]) return
		  if(val.ref.nodeType === 3 && val.ref.parentElement == null) return 
		  if(val.ref.nodeType === 2 && val.ref.OwnerElement == null) return 

		  num_nodes++

		  req_body.data[_id] = {
		    id: _id,
		    value: val.ref.__revloc__.value, // always send english text 
		    url: normalizedLocation(),
		    capture_url: location.href,
		    nodePos: _pos
		  }
		} 
		// existing node but value changed then 
		else {
			// detect change node content change 
			// may not be required 
			// ?????
		}
	}
	
	// create returned observable
	return Observable.create(observer => {
		intervalId = setInterval(() => {
			if(busy) {
				console.log('Not pushing, either busy or no new nodes found')
				observer.next({ result: false, continue: exitBusy })
				return
			}

			busy = true, num_nodes = 0
			let req_body = { url: normalizedLocation(), dict_key: dictKey(), data: {} }

		    // get all the new nodes 
		    objForEach(processedNodes, (val, key) => pickReqData(key, val, req_body))
		    // get all the new attributes 
		    objForEach(processedAttrs, (val, key) => pickReqData(key, val, req_body))
			
		    if(num_nodes > 0) observer.next({ result: true, continue: exitBusy, req_body })
		}, 3000)
		
		// the dispose method
		return () => { clearInterval(intervalId) }
	})

}