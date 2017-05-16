// iterate objects
export function objForEach(obj, cb) {
  let index = 0
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      index++
      cb && cb(obj[key], key, index, obj)
    }
  }
}

export function empty(o) {
  return (Object.keys(o).length == 0 && o.constructor === Object) ? true : false 
}

// return current timestamps
export function now() {
  return (new Date()).getTime().toFixed(0)
}


// make object with nested key and values
export function _m(obj, paths, values) {

  function makeNested(obj, path, value) {
    let path_keys = path.split('^'),
        cur_obj = obj

    path_keys.forEach((key, index, arr) => {
      if(!cur_obj[key]) {
        cur_obj[key] = {}
      }

      if(index != (arr.length - 1)) cur_obj = cur_obj[key]
      else cur_obj[key] = value
    })
    return obj
  }

  paths.forEach((p, index) => {
    makeNested(obj, p, values[index])
  })

  return obj
}

// get nested values if exist
export function _g(obj, path) {
  let keys = path.split('^'),
      found = true,
      _o = obj

  while(keys.length) {
    let __o = _o[keys.shift()]
    if(!__o) {
      found = false
      break
    }
    _o = __o
  }
  return (found ? _o : false)
}


// API helper functions 
export function success(message, res_obj = {}) {
  res_obj.success = true
  res_obj.message = message
  return res_obj
}

export function fail(message, res_obj = {}) {
  res_obj.success = false
  res_obj.message = message
  return res_obj
}



//
