import { Observable } from 'rxjs/Observable'
import 'rxjs/add/observable/interval'
import { objForEach, now } from './utils'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'

// scan the processed nodes and find out the new or changed nodes and emit 
export function getPushStream(dictionary, processedNodes, processedAttrs) {
	let busy = false,
		intervalId = null
	
	let enterBusy = () => busy = true
	let exitBusy = () => busy = false

	if(!dictionary.ids) dictionary.ids = []
	if(!dictionary.entries) dictionary.entries = {}

	let submitted_node_ids      = dictionary.ids
	let obs_dictionary_entries  = dictionary.entries

	return Observable.create(observer => {
		intervalId = setInterval(() => {
			if(busy) {
				console.log('Not pushing, either busy or no new nodes found')
				return
			}

			busy = true

			let num_nodes = 0,
		        req_body = { url: normalizedLocation(), dict_key: dictKey(), data: {} }

		    // get all the new nodes 
		    objForEach(processedNodes, (val, key) => {
		      if(val.ref.__revloc__.is_new) {
		          val.ref.__revloc__.is_new = false
		          
		          let _id = nodeId(val.ref, val.ref.__revloc__.value),
		            _pos = nodePos(val.ref);

		          if(!_id || val.ref.nodeValue.trim() === '' || val.ref.parentElement == null || submitted_node_ids[_id]) 
		            return

		          num_nodes++

		          req_body.data[_id] = {
		            id: _id,
		            value: val.ref.__revloc__.value, // always send english text 
		            url: normalizedLocation(),
		            capture_url: location.href,
		            nodePos: _pos
		          }
		        }
		    })

		    // get all the new attributes 
		    objForEach(processedAttrs, (val, key) => {
		      if(val.ref.__revloc__.is_new) {
		          val.ref.__revloc__.is_new = false
		          
		          let _id = nodeId(val.ref, val.ref.__revloc__.value),
		            _pos = nodePos(val.ref);

		          if(!_id || 
		            val.ref.nodeValue.trim() === '' || 
		            val.ref.ownerElement == null || // attributes have ownerElement set
		            submitted_node_ids[_id]) 
		            return

		          num_nodes++

		          req_body.data[_id] = {
		            id: _id,
		            value: val.ref.__revloc__.value, // always send english text 
		            url: normalizedLocation(),
		            capture_url: location.href,
		            nodePos: _pos
		          }
		        }
		    })
			
		    if(num_nodes > 0) observer.next({ continue: exitBusy, req_body })
		}, 2000)
		
		// the dispose method
		return () => { clearInterval(intervalId) }
	})

}