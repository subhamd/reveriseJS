/*
  This module responsible for updating the cache and requesting from translation
*/

// accepts an array of string in source language and
// calls a callback with array of curated response objects
function fetch(stringArray, target_lang, cb) {
	let req_data = JSON.stringify({ data: stringArray }),
  xhr = new XMLHttpRequest();

  xhr.open("POST", `https://api-revup.reverieinc.com/apiman-gateway/reverieinc/localization/1.0?target_lang=${target_lang}&source_lang=english&domain=3`);
  xhr.setRequestHeader("rev-api-key", "FE7JP7xAYGR8lB5XIFBEDYLxzbkWvyL8fD1E");
  xhr.setRequestHeader("rev-app-id", "com.nilout");
  xhr.setRequestHeader("content-type", "application/json");
  xhr.send(req_data);

  xhr.addEventListener("readystatechange", function () {
    let responseTextArray = []

    if (this.readyState === 4) {
      let response = JSON.parse(this.responseText)
      response.responseList.forEach((item) => {
        responseTextArray.push({ in: item.inString, out: item.outString })
      })
      cb && cb(responseTextArray)
    }
  })
}

export function checkUpdate(dict_key, timestamp, cb) {
	let req_data = JSON.stringify({ dict_key, timestamp }),
	xhr = new XMLHttpRequest();

  xhr.open("post", `http://localhost:8002/update-check`);
  xhr.setRequestHeader("rev-api-key", "FE7JP7xAYGR8lB5XIFBEDYLxzbkWvyL8fD1E");
  xhr.setRequestHeader("rev-app-id", "com.nilout");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(req_data);

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      cb && cb(JSON.parse(this.responseText))
    }
  })
}

export function submit(string_data, cb) {
	let req_data = JSON.stringify(string_data),
  xhr = new XMLHttpRequest();

  xhr.open("POST", `http://localhost:8002/submit`);
  xhr.setRequestHeader("rev-api-key", "FE7JP7xAYGR8lB5XIFBEDYLxzbkWvyL8fD1E");
  xhr.setRequestHeader("rev-app-id", "com.nilout");
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(req_data);

  xhr.addEventListener("readystatechange", function () {
    if (this.readyState === 4) {
      cb && cb(JSON.parse(this.responseText))
    }
  })
}

export default fetch;
