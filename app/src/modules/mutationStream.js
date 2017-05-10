import objectAssign from 'object-assign'
import { objForEach, now } from './utils'
import MutationObserver from 'mutation-observer'
import { nodeTreeWalker, is_allowed } from './walker'
import { nodeId, nodePos, nodeIdPos, absNodePos, dictKey, normalizedLocation } from './keygen'

import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/filter'

let nativeMutObserver   = null,
    processed_attrs     = {},
    processed_nodes     = {};


export function getMutationStream() {
	
	// returns hot observable
	return Observable.create(observer => {

		// if called multiple times, stop the previous observer
		if(nativeMutObserver) {
			nativeMutObserver.disconnect()
			nativeMutObserver = null
		}

		// create MutationObserver instance
		nativeMutObserver = new MutationObserver( mutations => {
	    	mutations.forEach( mutation => {
		      	// handle newly inserted nodes
				if(mutation.type === 'childList') {
					mutation.addedNodes.forEach(node => {
					  if(is_allowed(node)) observer.next(node)
					  // if element node 
					  if(node.nodeType === 1 && is_allowed(node)) 
					    nodeTreeWalker(node, n => observer.next(n))
					})
				}
	    	})
		})

		// start observing
		nativeMutObserver.observe(document, {
			childList: true,
			subtree: true
		});

	})
	.filter(node => {
		return (node.nodeType == 2 || node.nodeType == 3) // filter all the text nodes and attributes 
	})
	.map(node => {
		let _nPos = absNodePos(node),
          	_nId  = (node.__revloc__) ? nodeId(node, node.__revloc__.value): nodeId(node);
        return { node, id: _nId, absPos: _nPos }
	})
	.filter(nodeData => {
		return (nodeData.node && nodeData.id != false) // filter out the detached nodes
	})
}








//