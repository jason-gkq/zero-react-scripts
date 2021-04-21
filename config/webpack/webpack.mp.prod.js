"use strict";

const paths = require("../paths");
const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const PnpWebpackPlugin = require("pnp-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MpPlugin = require("mp-webpack-plugin");

const env = getClientEnvironment();
// const useTypeScript = fs.existsSync(paths.appTsConfig);

module.exports = {
  mode: "production",
  bail: true,
  devtool: "source-map",
  entry: {
    index: paths.appMpIndexJs,
  },
  output: {
    path: paths.appBuildMp, // 放到小程序代码目录中的 common 目录下
    filename: "[name].js", // 必需字段，不能修改
    library: "createApp", // 必需字段，不能修改
    libraryExport: "default", // 必需字段，不能修改
    libraryTarget: "window", // 必需字段，不能修改
    hashDigestLength: 8,
    pathinfo: false,
    // publicPath: paths.publicUrlOrPath,
  },
  target: "web", // 必需字段，不能修改
  optimization: {
    runtimeChunk: false, // 必需字段，不能修改
    splitChunks: {
      // 代码分隔配置，不建议修改
      chunks: "all",
      minSize: 1000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 100,
      maxInitialRequests: 100,
      automaticNameDelimiter: "~",
      // name: true,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          safari10: false,
          compress: {
            ecma: 5,
            comparisons: false,
            inline: 2,
          },
          keep_classnames: true,
          keep_fnames: true,
          output: {
            ecma: 5,
            comments: false,
            ascii_only: true,
          },
        },
      }),
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          preset: [
            "default",
            {
              discardComments: { removeAll: true },
            },
          ],
        },
      }),
    ],
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        test: /\.css$/,
        include: /src/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
        sideEffects: true,
      },
      {
        test: /\.(less|css)$/,
        include: /node_modules/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
          },
          {
            loader: "css-loader",
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                strictMath: false,
                javascriptEnabled: true,
              },
            },
          },
        ],
        sideEffects: true,
      },
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        loader: "babel-loader",
        include: paths.appPath,
        exclude: /node_modules/,
        options: {
          babelrc: false,
          configFile: false,
          cacheDirectory: true,
          cacheCompression: false,
          compact: true,
          presets: [
            [
              require("@babel/preset-env"),
              {
                useBuiltIns: "entry",
                corejs: 3,
                exclude: ["transform-typeof-symbol"],
              },
            ],
            [
              require("@babel/preset-react").default,
              {
                development: false,
                useBuiltIns: true,
                runtime: "automatic",
              },
            ],
          ].filter(Boolean),
          plugins: [
            ["@babel/plugin-syntax-jsx"],
            ["@babel/plugin-transform-react-jsx"],
            ["@babel/plugin-transform-react-display-name"],
            ["babel-plugin-add-module-exports"],
            [
              require("@babel/plugin-transform-flow-strip-types").default,
              false,
            ],
            require("babel-plugin-macros"),
            ["@babel/plugin-proposal-decorators", { legacy: true }],
            ["@babel/plugin-proposal-class-properties", { loose: true }],
            [
              require("@babel/plugin-transform-runtime"),
              {
                corejs: false,
                helpers: true,
                version: require("@babel/runtime/package.json").version,
                regenerator: true,
                useESModules: true,
                absoluteRuntime: path.dirname(
                  require.resolve("@babel/runtime/package.json")
                ),
              },
            ],
            [
              require("babel-plugin-transform-react-remove-prop-types").default,
              {
                removeImport: true,
              },
            ],
            require("@babel/plugin-proposal-optional-chaining").default,
            require("@babel/plugin-proposal-nullish-coalescing-operator")
              .default,
          ].filter(Boolean),
        },
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: "file-loader",
        options: {
          name: "[name].[ext]?[hash]",
        },
      },
    ],
  },
  resolve: {
    modules: ["node_modules", paths.appNodeModules].concat(
      modules.additionalModulePaths || []
    ),
    extensions: paths.moduleFileExtensions.map((ext) => `.${ext}`),
    alias: getAlias(),
    // alias: Object.assign({}, getAlias(), {
    //   react: "react/umd/react.development.js",
    //   "react-dom": "react-dom/umd/react-dom.development.js",
    // }),
    plugins: [PnpWebpackPlugin],
  },
  resolveLoader: {
    plugins: [PnpWebpackPlugin.moduleLoader(module)],
  },
  // @ts-ignore
  plugins: [
    new MpPlugin(require("../miniprogram.config")),
    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    // new webpack.DefinePlugin({
    //   "process.env.isMiniprogram": process.env.isMiniprogram, // 注入环境变量，用于业务代码判断
    // }),
    new MiniCssExtractPlugin({
      filename: "[name].wxss",
    }),
  ],
};
