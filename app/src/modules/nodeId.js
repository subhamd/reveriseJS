import md5 from 'spark-md5'
/*
 Calculates a unique node is based on the position of the node in the DOM
*/
export default function(node) {
  return md5.hash((rec(node).trim() + '#' + node.textContent.trim()).trim())
}

// returns the node position in special format
// which contains position of node within an element as wel as the parent hierarchy
export function nodePos(node) {
  return rec(node)
}

// this recursive function calculates the unique node id
function rec(node) {
  if(node.nodeName === 'HTML') return 'HTML'
  // get the siblings
  let siblings = (node.parentNode || node.ownerElement).childNodes
  let i = 0
  // get the index of the current node among the siblings
  if(siblings.length == 1) {
    return `${node.nodeName}:0 ` + rec(node.parentNode || node.ownerElement)
  }

  let node_index = 0
  for(i = 0; i < siblings.length; i++) {
    if(node === siblings[i]) {
      node_index = i
      break
    }
  }

  return `${node.nodeName}:${node_index} ` + rec(node.parentNode || node.ownerElement)
}

// returns a source key for dictionary when provided nodeId and text
export function sourceKey(nodeId, text) {
  return md5((`${nodeId}#${text}`).trim())
}

// returns a source key for dictionary when provided DOM node
export function sourceKeyFromNode(node) {
  let _nodeId = nodeId(node),
      text = node.textContent
  return (`${nodeId}#${text}`).trim()
}
