let config = {
  port: 8002,
  connection_string: 'mongodb://localhost:27017/phrase_db',
  translationApiEndPoint: 'https://api-revup.reverieinc.com/apiman-gateway/reverieinc_demo_pages/localization/1.0',
  apikey: "9bb72187c4f72b4cb643305f817478cd",
  appid: "MY_LANGUAGE_APP",
  redis: {
  	port: 6379, 
  	host: '127.0.0.1'
  }
}

export default config;
