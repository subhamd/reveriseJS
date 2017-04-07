import Promise from 'bluebird'
import unirest from 'unirest'
import config from './config'

function translate(entries, target_lang) {
  let source_strings = entries.map(entry => entry.value),
      str_ids = entries.map(entry => entry.id)

  return new Promise((resolve, reject) => {
    unirest.post(`${config.translationApiEndPoint}?target_lang=${target_lang}&source_lang=english&domain=3`)
    .headers({
      "rev-api-key": config.apikey,
      "rev-app-id": config.appid,
      "content-type": "application/json"
    })
    .send(JSON.stringify({ data: source_strings } ))
    .end(response => {
      let responseBody = response.body
      resolve(responseBody.responseList.map((item, index) => {
        return { id: str_ids[index], value: item.outString }
      }))
    })
  })
}

export default translate;
