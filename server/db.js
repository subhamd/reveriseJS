import config from './config'
import mongodb from 'mongodb'
import Promise from 'bluebird'

let _db = null,
    _db_connected = false;

let database = {
  connect: () => {
    return new Promise((resolve, reject) => {
      if(_db_connected && _db) {
        resolve(_db)
      }
      else {
        mongodb.MongoClient.connect(config.connection_string).then(db => {
          _db_connected = true
          _db = db
          resolve(db)
        }).catch(err => {
          reject(err)
        })
      }
    })
  }
}

export default database;
