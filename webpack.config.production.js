import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import WebpackMd5Hash from 'webpack-md5-hash';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CleanWebpackPlugin from 'clean-webpack-plugin';

import path from 'path';

const GLOBALS = {
  'process.env.NODE_ENV': JSON.stringify('production'),
  __DEV__: false
};

export default {
  resolve: {
    enforceExtension: false,
    "alias": {
      "react": "preact-compat",
      "react-dom": "preact-compat"
    }
  },

  devtool: 'source-map',

  context: path.resolve(__dirname, './app'),
  entry: {
    appx: './src/main.js'
  },

  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    filename: 'scripts/bundle.[hash].js'
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
            cacheDirectory: './.cache'
          }
        }]
      },
      { test: /\.json$/, use: ["json-loader"] },
      { test: /\.(css|sass|scss)$/, loader: ExtractTextPlugin.extract({
        fallbackLoader: 'style-loader',
        loader: ['css-loader?sourceMap', 'postcss-loader', 'sass-loader']
      }) },
      { test: /\.eot(.*)$/,
        use: [{
          loader: 'file-loader',
          options: { name:"/fonts/[name].[ext]", limit:5000 }
        }]},
      { test: /\.(woff|woff2)(.*)$/,
        use: [{
          loader: 'file-loader',
          options: { name:"/fonts/[name].[ext]", limit:5000 }
        }]
      },
      { test: /\.ttf(.*)$/,
        use: [{
          loader: 'file-loader',
          options: { name:"/fonts/[name].[ext]", limit:5000 }
        }]
      },
      {test: /\.(jpe?g)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options:{ mimetype: 'image/jpeg'} } ] },
      {test: /\.(png)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/png' } } ] },
      {test: /\.(gif)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/gif' } } ] },
      {test: /\.(svg)(\?v=\d+\.\d+\.\d+)?$/, use: [{ loader: 'url-loader', options: { mimetype: 'image/svg' } } ] }
    ]
  },

  plugins: [
    // defines GLOBALS, in our case we are setting the production flag
    new webpack.DefinePlugin(GLOBALS),

    new WebpackMd5Hash(),

    new CleanWebpackPlugin(['dist'], {
      root: __dirname,
      verbose: true,
      dry: false
    }),

    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'commons',
    //   filename: 'scripts/commons.js',
    //   minChunks: 2,
    // }),

    new ExtractTextPlugin("styles/[name].[hash].css"),

    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),

    // Minify JS
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      output: {
        comments: false,
      }
    }),

    new HtmlWebpackPlugin({
      template: '../tools/template.html',
      inject: 'body',
      cache: false
    }),

    // copy static resources
    new CopyWebpackPlugin([{
      from: 'images',
      to: 'images'
    }], {
      copyUnmodified: true
    }),
  ]
}
