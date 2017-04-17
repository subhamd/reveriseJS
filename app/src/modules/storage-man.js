import objectAssign from 'object-assign'
import * as lz from 'lz-string'

// update local storage with default values
export function storageInit() {
  let settings = localStorage.getItem('__settings__')
  if(!settings) {
    localStorage.setItem('__settings__', lz.compress('{ "currentLang": "value" }'))
  }
}

export function getObject(key) {
  let item = localStorage.getItem(key)
  return (item ? JSON.parse( lz.decompress( item ) ) : false)
}

export function setObject(key, obj) {
  let serialized_data = JSON.stringify(obj),
      compressed = lz.compress(serialized_data)

  if(typeof obj != 'string')
    localStorage.setItem(key, compressed)
  else {
    localStorage.setItem(key, lz.compress( obj ) )
  }
  return obj
}

export function removeObject(key) {
  localStorage.removeItem(key)
}

export function clearAll() {
  localStorage.clear()
}
