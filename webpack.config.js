import webpack from 'webpack'
import path from 'path'

export default {

  devtool: 'inline-source-map',

  resolve: {
    enforceExtension: false
  },

  context: path.resolve(__dirname, './app'),

  entry: [
    'webpack-hot-middleware/client?reload=true',
    './src/main.js',
  ],

  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    filename: 'scripts/bundle.js'
  },

  target: 'web',

  devServer: {
    contentBase: path.resolve(__dirname, 'app')
  },

  // module loader section
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [
          path.resolve(__dirname, 'app/src')
        ],
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [["es2015", {"modules": false}]],
            cacheDirectory: './.cache'
          }
        }]
      },
      { test: /\.json$/, use: ["json-loader"] },
      { test: /\.(sass|scss)$/, use: ["style-loader", "css-loader", "postcss-loader", "sass-loader"] },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.eot(.*)$/,
        use: [{
          loader: 'url-loader',
          options: { prefix: "fonts", limit:5000 }
        }]},
      { test: /\.(woff|woff2)(.*)$/,
        use: [{
          loader: 'url-loader',
          options: { prefix: "fonts", limit:5000 }
        }]
      },
      { test: /\.ttf(.*)$/,
        use: [{
          loader: 'url-loader',
          options: { prefix: "fonts", limit:5000 }
        }]
      },
      {test: /\.(jpe?g)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options:{ mimetype: 'image/jpeg'} } ] },
      {test: /\.(png)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/png' } } ] },
      {test: /\.(gif)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/gif' } } ] },
      {test: /\.(svg)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/svg' } } ] }
    ]
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  ]
}






//
