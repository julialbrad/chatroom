const webpack = require("webpack");

module.exports = {
  entry: "./src/client/index.jsx",
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ]
  },
  resolve: {
    extensions: ["*", ".js", ".jsx"]
  },
  output: {
    path: __dirname + "/dist",
    publicPath: "/",
    filename: "bundle.js"
  },
  devtool: "#eval-source-map",
  plugins: [new webpack.HotModuleReplacementPlugin()],
  devServer: {
    contentBase: "./dist",
    hot: true
  }
};
