import Promise from 'bluebird'
import db from '../db'

export default function accountFactory() {

  return {
    // create initial account
    createAccount: (apikey, appid) => {
      return new Promise((resolve, reject) => {

        db.connect().then(db => {

          db.createCollection(apikey)
          .then(collection => {

            collection.findOne({ info: { $exists: true } })
            .then((docs) => {
              // if there is no doc then create new
              if(!docs) {
                collection.insertOne({ info: { apikey }, apps: {} })
                .then(result => resolve(result))
              } else {
                // already created
                resolve(true)
              }
            })
            .catch(err => reject(err))
          })
          .catch((err) => reject(err))
        })
      })
    }
  }
}
