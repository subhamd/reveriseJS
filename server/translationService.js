import Promise from 'bluebird'
import unirest from 'unirest'

function translate(entries, target_lang) {
  let source_strings = entries.map(entry => entry.value),
      str_ids = entries.map(entry => entry.id)

  return new Promise((resolve, reject) => {
    unirest.post(`https://api-revup.reverieinc.com/apiman-gateway/reverieinc/localization/1.0?target_lang=${target_lang}&source_lang=english&domain=3`)
    .headers({
      "rev-api-key": "FE7JP7xAYGR8lB5XIFBEDYLxzbkWvyL8fD1E",
      "rev-app-id": "com.nilout",
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
