const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

module.exports = (env, argv) => ({
  mode: argv.mode === 'production' ? 'production' : 'development',

  // This is necessary because Figma's 'eval' works differently than normal eval
  devtool: argv.mode === 'production' ? false : 'inline-source-map',
  entry: {
    code: './src/code.ts', // This is the entry point for our plugin code.
    ui: './src/ui.js'
  },
  module: {
    rules: [
      // Converts TypeScript code to JavaScript
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        type: 'javascript/auto',
        test: /\.json$/,
        include: /(lottie)/,
        loader: 'lottie-web-webpack-loader',
      }
    ],
  },
  // Webpack tries these extensions for you if you omit the extension like "import './file'"
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['ui'], // Include only the 'ui' chunk (from ui.js)
      filename: 'ui.html',
      template: './ui.html',
      inject: 'body', // Inject JavaScript into the body
    }),
    new HtmlInlineScriptPlugin({
      scriptMatchPattern: [/ui\.js$/], // Inline only the ui.js script
    }),
    new MiniCssExtractPlugin({
      filename: 'styles.css', // Outputs styles.css temporarily
    }),
    new HTMLInlineCSSWebpackPlugin({
      styleTagFactory({ style }) {
        return `<style>${style}</style>`;
      },
    }),
  ],
});