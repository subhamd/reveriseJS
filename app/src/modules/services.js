import { post } from './utils'
import { nodeTreeWalker } from './walker'
import { nodeId, nodePos, dictKey, normalizedLocation } from './keygen'

// services factory
function factory(config) {

  let { base_url, headers } = config

  return {
    // submit all data to the backend
    submit(data) {
      // 5 min timeout for translation to happen on the backend
      return post(`${base_url}submit`, data, { ...headers, timeout: (5 * 60000) })
    },

    // check for update in a dictionary
    checkUpdate(dict_key, local_timestamp) {
      let numStr = 0
      nodeTreeWalker(document, node => numStr++)
      return post(`${base_url}update-check`, { dict_key,  timestamp: local_timestamp, numStr }, headers)
    }
  }
}

export default factory;
