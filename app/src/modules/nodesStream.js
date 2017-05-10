import { Observable } from 'rxjs/Observable'
import { nodeTreeWalker } from './walker'

// creates a stream which emits all the child text nodes of the node parameter
export function createNodesStream(node) {
  return Observable.create(function(observer) {
    nodeTreeWalker(node, function(n) { observer.next(n) })
  })
}