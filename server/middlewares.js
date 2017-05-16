import dbc from './db'

// app authentication middleware 
export function auth(req, res, next) {
  let apikey = req.headers['rev-api-key'],
      appid = req.headers['rev-app-id']

  if(!apikey) {
    res.json(fail("Required header missing: 'rev-api-key'"))
    return
  }

  if(!appid) {
    res.json(fail("Required header missing: 'rev-app-id'"))
    return
  }

  appid = appid.replace('.', '~')

  dbc.connect().then(db => {
    return db.collection('APPS').findOne({ apikey, id: appid })
  })
  .then(app => {
    if(!app) {
      res.json(fail("App authentication failed."))
    }
    else {
      req.app = app // add app to the request 
      req.apikey = apikey
      req.appid = appid
      next() // call next middleware 
    }
  })
}