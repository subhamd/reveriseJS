import objectAssign from 'object-assign'

// update local storage with default values
export function storageInit() {
  let settings = localStorage.getItem('__settings__')
  if(!settings) {
    localStorage.setItem('__settings__', JSON.stringify({ currentLang: 'value' }))
  }
}

export function getObject(key) {
  let item = localStorage.getItem(key)
  return (item ? JSON.parse(item) : false)
}

export function setObject(key, obj) {
  if(typeof obj != 'string')
    localStorage.setItem(key, JSON.stringify(obj))
  else localStorage.setItem(key, obj)
  return obj
}

export function removeObject(key) {
  localStorage.removeItem(key)
}
