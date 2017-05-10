import { nodeTreeWalker } from './walker'

// DOM patching 
let originalCloneNode = Node.prototype.cloneNode
Node.prototype.cloneNode = function(deep) {
  let temp_node = null,
      text_nodes = []
  
  // if this is a text node, no need to traverse the tree which is expensive 
  if(this.nodeType === 2 && this.nodeType === 3 && this.__revloc__) {
    this.__revloc__.__temp__ = this.nodeValue
    temp_node = originalCloneNode.call(this, deep)
    this.nodeValue = this.__revloc__.__temp__
    this.__revloc__.__temp__ = null
    return temp_node
  }
  
  // collect all the text nodes 
  nodeTreeWalker(this, n => {
    text_nodes.push(n)
  })
  
  // restore to original text before copying 
  text_nodes.forEach(t => {
    if(t.__revloc__) {
      t.__revloc__.__temp__ = t.nodeValue
      t.nodeValue = t.__revloc__.value
    }
  })
  
  // clone using native method 
  temp_node = originalCloneNode.call(this, deep)
  text_nodes.forEach(t => {
    if(t.__revloc__) {
      t.nodeValue = t.__revloc__.__temp__
      t.__revloc__.__temp__ = null
    }
  })
  
  text_nodes = [] // free the memory 
  return temp_node // return modified node 
}