"use strict";

process.env.BABEL_ENV = "development";
process.env.NODE_ENV = "development";
// process.env.application = "web";

const webpackDevServer = require("webpack-dev-server");
// const mock = require('cf-mock-server/express-mw')
const webpack = require("webpack");
const config = require("../config/webpack/webpack.dev");

const options = {
  compress: true,
  hot: true,
  // host: "localhost",
  port: 8080,
  client: false,
  historyApiFallback: true, // 一定要加上，不然浏览器输入指定页面会发起GET请求，而不是加载页面
  // historyApiFallback: { // 多入口配置
  //   rewrites: [
  //     { from: /^\/$/, to: '/views/landing.html' },
  //     { from: /^\/subpage/, to: '/views/subpage.html' },
  //     { from: /./, to: '/views/404.html' },
  //   ],
  // },
  client: {
    logging: "warn",
    overlay: true,
    progress: true,
    reconnect: 3,
  },
};

const compiler = webpack(config);
const server = new webpackDevServer(options, compiler);

server.startCallback(() => {
  console.log("Starting server on http://localhost:8080");
});
