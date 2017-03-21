import objectAssign from 'object-assign'

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
  let current_val = getObject(key) || {}
  current_val[key] = obj
  localStorage.setItem(key, JSON.stringify(current_val))
}

export function removeObject(key) {
  localStorage.removeItem(key)
}

export default function getOrSet(key, value, set) {
  let stored_data = localStorage.getItem(key)

  if(stored_data && !set) {
    return JSON.parse(stored_data)
  }

  if(stored_data && set) {
    stored_data = objectAssign(value)
    localStorage.setItem(key, JSON.stringify(stored_data))
    return stored_data
  }

  if(set) {
    localStorage.setItem(key, JSON.stringify(value))
    return value
  }
  else {
    return value
  }
}
