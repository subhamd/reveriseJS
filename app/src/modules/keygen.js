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
let salt = null,
i = 0;
export function nodeId(node, content) {
  console.log(i++)

  salt = (rec(node).trim() + '#' + (content || node.nodeValue.trim())).trim()

  if(salt.indexOf('^') !== -1) return false

  return md5.hash(salt)
}

// returns the node position in special format
// which contains position of node within an element as wel as the parent hierarchy
export function nodePos(node) {
  return rec(node).trim()
}

// not safe
export function nodeIdPos(node) {
  //console.log(i++)
  let node_pos = rec(node).trim()

  let node_id = md5.hash( ( node_pos + '#' + node.textContent.trim() ).trim() )
  return { node_id, node_pos}
}

export function absNodePos(node) {
  return absRec(node).trim()
}

// this recursive function calculates the unique node id
function rec(node) {
  if(!(node.parentNode || node.ownerElement)) {
    return '^ '
  }
  if(node.nodeName === 'HTML') return 'HTML'
  return `${node.nodeName} ` + rec(node.parentNode || node.ownerElement)
}

function absRec(node) {

  if(!(node.parentNode || node.ownerElement)) {
    return '^ '
  }

  if(node.nodeName === 'HTML') return 'HTML'
  // get the siblings
  let siblings = (node.parentNode || node.ownerElement).childNodes
  let i = 0
  // get the index of the current node among the siblings
  if(siblings.length == 1) {
    return `${node.nodeName}:0 ` + absRec(node.parentNode || node.ownerElement)
  }

  let node_index = 0
  for(i = 0; i < siblings.length; i++) {
    if(node === siblings[i]) {
      node_index = i
      break
    }
  }

  return `${node.nodeName}:${node_index} ` + absRec(node.parentNode || node.ownerElement)
}
