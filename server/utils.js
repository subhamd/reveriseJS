export function objForEach(obj, cb) {
  let index = 0
  for(let key in obj) {
    if(obj.hasOwnProperty(key)) {
      index++
      cb && cb(obj[key], key, index, obj)
    }
  }
}

export function now() {
  return (new Date()).getTime().toFixed(0)
}
