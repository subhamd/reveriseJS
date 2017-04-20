import md5 from 'spark-md5'
import normalizeUrl from 'normalize-url'

export function normalizedLocation() {
  let loc_url = window.location.protocol + '//' + window.location.host + window.location.pathname
  return normalizeUrl(loc_url.trim())
}

// returns unique dictionary key
export function dictKey() {
  return md5.hash(normalizedLocation())
}

/*
 Calculates a unique node is based on the position of the node in the DOM
*/
export function nodeId(node) {  
  return md5.hash((rec(node).trim() + '#' + node.textContent.trim()).trim())
}

// returns the node position in special format
// which contains position of node within an element as wel as the parent hierarchy
export function nodePos(node) {
  return rec(node)
}

// this recursive function calculates the unique node id
function rec(node) {

  if(!(node.parentNode || node.ownerElement)) {
    return "invalid"
  }

  if(node.nodeName === 'HTML') return 'HTML'
  // get the siblings
  //let siblings = (node.parentNode || node.ownerElement).childNodes
  //let i = 0
  // get the index of the current node among the siblings
  // if(siblings.length == 1) {
  //   return `${node.nodeName} ` + rec(node.parentNode || node.ownerElement)
  // }

  // let node_index = 0
  // for(i = 0; i < siblings.length; i++) {
  //   if(node === siblings[i]) {
  //     node_index = i
  //     break
  //   }
  // }

  return `${node.nodeName} ` + rec(node.parentNode || node.ownerElement)
}
