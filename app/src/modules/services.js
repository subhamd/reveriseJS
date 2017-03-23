import { post } from './utils'
import walker from './walker'
import { nodeId, nodePos, dictKey, normalizedLocation } from './keygen'

// services factory
function factory(config) {

  let { base_url, headers } = config

  return {
    // submit all data to the backend
    submit() {

      let req_data = {
        url: normalizedLocation(),
        dict_key: dictKey(),
        data: {}
      }

      walker(node => {
        let id = nodeId(node),
            pos = nodePos(node)
        req_data.data[id] = {
          id,
          value: node.textContent,
          url: normalizedLocation(),
          capture_url: location.href,
          nodePos: pos
        }
      })

      return post(`${base_url}submit`, req_data, headers)
    },

    // fetch a dictionary from backend
    fetch(dict_key) {
      //return post(`${base_url}fetch`, ...)
    },

    // check for update in a dictionary
    checkUpdate(dict_key, local_timestamp) {
      return post(`${base_url}update-check`, { dict_key,  timestamp: local_timestamp}, headers)
    }

  }
}

export default factory;
