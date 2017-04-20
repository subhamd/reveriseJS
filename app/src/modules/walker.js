var acceptedNodeFilter = {
  acceptNode: function(node) {
    if (node.parentNode.nodeName !== 'SCRIPT' &&
        node.parentNode.nodeName !== 'STYLE' &&
        node.nodeValue.trim() != "" &&
        node.parentNode.dataset.nolocalize != 'true') {
      return NodeFilter.FILTER_ACCEPT;
    }
  }
}

// will walk the dom and call the callback with non empty text nodes only
function DOM_walker(cb) {
  let node = null
  let walker = document.createTreeWalker(
      document,
      NodeFilter.SHOW_TEXT,
      acceptedNodeFilter,
      false
  )

  while(node = walker.nextNode()) {
    cb && cb(node)
  }

  document.querySelectorAll('[placeholder], [title]').forEach(element => {
    let attrs = element.attributes
    let acceptedAttrs = ['placeholder', 'title']

    for(let i = 0; i < attrs.length; i++) {
      if(acceptedAttrs.indexOf(attrs[i].nodeName.toLowerCase()) != -1) {
        cb && cb(attrs[i])
      }
    }
  })
}

// walk a node recursively for all the childrens
export function nodeWalker(node, cb) {
  let walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      acceptedNodeFilter,
      false
  )

  while(node = walker.nextNode()) {
    cb && cb(node)
  }
}

export default DOM_walker;
