import Promise from 'bluebird'
import unirest from 'unirest'
import config from './config'

function translate(entries, target_lang) {
  let source_strings = entries.map(entry => entry.value),
      str_ids = entries.map(entry => entry.id),
      promises = [],
      chunks = [],
      idchunks = [],
      i = 0, //index
      c = 10, //chunk size
      m = Number.parseInt(source_strings.length / c) //num chunk

  // break the data into chunks
  while(source_strings.length) {
    chunks.unshift(source_strings.splice(-c))
    idchunks.unshift(str_ids.splice(-c))
  }
  // for each chunk create promises
  chunks.forEach((chunk, index) => {
    promises.push(new Promise((resolve, reject) => {
      unirest.post(`${config.translationApiEndPoint}?target_lang=${target_lang}&source_lang=english&domain=3`)
      .headers({
        "rev-api-key": config.apikey,
        "rev-app-id": config.appid,
        "content-type": "application/json"
      })
      .send(JSON.stringify({ data: chunks[index] } ))
      .end(response => {
        if(!response.body) console.log(response)
        if(response.body && !response.body.responseList) console.log(response)

        let responseBody = response.body
        resolve(responseBody.responseList.map((item, index) => {
          return { id: idchunks[index], value: item.outString }
        }))
      })
    }))
  })

  // combine the results and return
  return Promise.all(promises)
  .then(results => {
    let all = []
    results.forEach(r => all = all.concat(r))
    return all
  })
}

export default translate;
