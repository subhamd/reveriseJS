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

export default fetch;
