import Promise from 'promise-polyfill'

// checks if the argument is an empty object 
export function empty(o) {
  return (Object.keys(o).length == 0 && o.constructor === Object) ? true : false 
}

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

// return current timestamps
export function now() {
  return (new Date()).getTime().toFixed(0)
}

// http post
export function post(url, req_body, headers = {}) {
  let req_body_str = JSON.stringify(req_body),
      xhr = new XMLHttpRequest()

  return new Promise((resolve, reject) => {
    xhr.open('POST', url);
    objForEach(headers, (header, key) => { xhr.setRequestHeader(key, header) })
    xhr.send(req_body_str);

    xhr.addEventListener("readystatechange", function () {
      if(this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        resolve(JSON.parse(this.responseText))
      }
    })
  })
}


export function make_error(msg) {
  let err = new Error()
  err.message = msg
  return err
}


//
