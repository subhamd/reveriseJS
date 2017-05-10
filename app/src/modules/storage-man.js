import objectAssign from 'object-assign'
import * as lz from 'lz-string'

// remove these two exports TD
window.compress = lz.compressToUTF16
window.decompress = lz.decompressFromUTF16

// update local storage with default values
export function storageInit() {
  let settings = localStorage.getItem('__settings__')
  if(!settings) {
    localStorage.setItem('__settings__', lz.compressToUTF16('{ "currentLang": "value" }'))
  }
}

// retrieve object from localStorage
export function getObject(key) {
  let item = localStorage.getItem(key)
  return (item ? JSON.parse( lz.decompressFromUTF16( item ) ) : false)
}

// store objects in the localstorage
export function setObject(key, obj) {
  let serialized_data = JSON.stringify(obj),
      compressed = lz.compressToUTF16(serialized_data)

  try {
    if(typeof obj != 'string')
      localStorage.setItem(key, compressed)
    else {
      localStorage.setItem(key, lz.compressToUTF16( obj ) )
    }
  }
  catch(ex) {
    // handle failure to save data
  }

  return obj
}

// remove object from localstorage 
export function removeObject(key) {
  localStorage.removeItem(key)
}

// clear all localStorage 
export function clearAll() {
  localStorage.clear()
}
