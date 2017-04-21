
// traverses a node for all childr text/attribute nodes 
export function nodeTreeWalker(node, cb) {

  let restrictedNodes = ['SCRIPT', 'STYLE', 'OBJECT', 'EMBED'],
      allowedAttrs    = ['placeholder', 'title']; // visible attributes 

  // filter allowed nodes 
  function is_allowed(n) {
    let allowed = true
    
    // if element node 
    if(n.nodeType === 1) {
      if(restrictedNodes.indexOf(n.nodeName) !== -1) allowed = false
      if(n.dataset.nolocalize) allowed = false
    }

    if( (n.nodeType === 2 || n.nodeType === 3) && n.nodeValue.trim() == '') return false
    if(n.nodeType === 2 && allowedAttrs.indexOf(n.nodeName) === -1) return false

    return allowed 
  }

  // recursively traverse the tree 
  function rec(_node) {
    // check eligibility
    if(is_allowed(_node)) {
      // send back only the text nodes 
      if(_node.nodeType === 3) cb(_node)
    }
    else return

    // process attributes if the node is an element node here 
    if(_node.nodeType === 1 && _node.attributes.length > 0) {
      let attrs = _node.attributes

      for(let i = 0; i < attrs.length; i++)
        if(is_allowed(attrs[i])) cb(attrs[i])
    }
    
    // process childrens 
    _node.childNodes.forEach(n => rec(n))
  }

  rec(node)
}
