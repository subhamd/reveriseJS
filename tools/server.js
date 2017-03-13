import express from 'express';
import webpack from 'webpack';
import path from 'path';
import config from '../webpack.config';
import open from 'open';

/* eslint-disable no-console */

const port = 8001;
const app = express();
const compiler = webpack(config);

// serving static assets from app directory
app.use(express.static(path.resolve(__dirname, '../app/')));

app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));

app.get('*', function(req, res) {
  res.sendFile(path.join( __dirname, '../app/index.html'));
});

app.listen(port, function(err) {
  if (err) {
    console.log(err);
  } else {
    open(`http://localhost:${port}`);
  }
});
