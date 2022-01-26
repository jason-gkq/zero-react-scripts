"use strict";

const paths = require("../paths");
// const modules = require("../modules");
const { getClientEnvironment, getAlias } = require("../env");

const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
// const PnpWebpackPlugin = require("pnp-webpack-plugin");
const postcssNormalize = require("postcss-normalize");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
// const AddAssetHtmlPlugin = require("add-asset-html-webpack-plugin"); // dll 解析
const InterpolateHtmlPlugin = require("../../lib/InterpolateHtmlPlugin");
// const WorkboxPlugin = require("workbox-webpack-plugin"); // production

const env = getClientEnvironment();
const useTypeScript = fs.existsSync(paths.appTsConfig);
const swSrc = fs.existsSync(paths.swSrc);

let modifyVars = {};
const { raw } = env;
if (
  raw.productConfig.theme &&
  fs.existsSync(`${paths.appPublic}/themes/${raw.productConfig.theme}.json`)
) {
  modifyVars = require(`${paths.appPublic}/themes/${raw.productConfig.theme}.json`);
}

const svgToMiniDataURI = require("mini-svg-data-uri");

module.exports = {
  mode: "production",
  bail: true,
  devtool: "source-map",
  entry: {
    main: paths.appIndexJs,
  },
  output: {
    hashDigestLength: 8,
    pathinfo: false,
    path: paths.appBuild,
    filename: "static/[name]/[name].[contenthash].js",
    chunkFilename: "static/[name]/[name].[contenthash].chunk.js",
    publicPath: paths.publicUrlOrPath,
    // assetModuleFilename: "static/media/[name].[hash:8].[ext]",
    // assetModuleFilename: "static/media/[name].[hash:8][ext]",
    devtoolModuleFilenameTemplate: (info) =>
      path
        .relative(paths.appSrc, info.absoluteResourcePath)
        .replace(/\\/g, "/"),
  },
  // @ts-ignore
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: paths.appHtml,
      inject: true,
      favicon: `${paths.appPublic}/favicon.ico`,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
    new MiniCssExtractPlugin({
      filename: "static/[name]/[name].[contenthash].css",
      chunkFilename: "static/[name]/[name].[contenthash].chunk.css",
      ignoreOrder: false, // 忽略有关顺序冲突的警告
    }),
    new InterpolateHtmlPlugin(HtmlWebpackPlugin, {
      PUBLIC_URL: paths.publicUrlOrPath,
    }),
    new webpack.DefinePlugin(env.stringified),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/locale$/,
      contextRegExp: /moment$/,
    }),
    new WebpackManifestPlugin({
      fileName: "asset-manifest.json",
      publicPath: paths.publicUrlOrPath,
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        const entrypointFiles = entrypoints.main.filter(
          (fileName) => !fileName.endsWith(".map")
        );

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    }),
    useTypeScript && new ForkTsCheckerWebpackPlugin(),
  ].filter(Boolean),
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        // minify: TerserPlugin.uglifyJsMinify,
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
    splitChunks: {
      chunks: "all",
      minSize: 200000, // 最小不小于 200k
      maxSize: 3348576,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      minChunks: 1,
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          filename: "vendor/[name].[contenthash].chunk.js",
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    moduleIds: "deterministic",
    chunkIds: "deterministic",
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}`,
    },
  },
  resolve: {
    // modules: ["node_modules", paths.appNodeModules].concat(
    //   modules.additionalModulePaths || []
    // ),
    extensions: paths.moduleFileExtensions
      .map((ext) => `.${ext}`)
      .filter((ext) => useTypeScript || !ext.includes("ts")),
    alias: getAlias(),
    // plugins: [PnpWebpackPlugin],
  },
  // resolveLoader: {
  //   plugins: [PnpWebpackPlugin.moduleLoader(module)],
  // },
  // node: {
  //   global: true,
  //   __filename: true,
  //   __dirname: true,
  // },
  performance: {
    hints: "error",
    maxEntrypointSize: 4000000,
    maxAssetSize: 3348576,
  },
  module: {
    strictExportPresence: true,
    rules: [
      {
        oneOf: [
          {
            test: /\.(js|jsx|ts|tsx)$/,
            include: paths.appSrc,
            // include: paths.appPath,
            // exclude: /node_modules/,
            loader: require.resolve("babel-loader"),
            options: {
              sourceMaps: true,
              cacheDirectory: true,
              cacheCompression: false,
              compact: true,
              presets: [
                [
                  require("@babel/preset-env"),
                  {
                    useBuiltIns: "entry",
                    corejs: 3,
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
                useTypeScript && [require("@babel/preset-typescript").default],
              ].filter(Boolean),
              plugins: [
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
                  require("babel-plugin-transform-react-remove-prop-types")
                    .default,
                  {
                    removeImport: true,
                  },
                ],
                ["@babel/plugin-proposal-decorators", { legacy: true }],
                ["@babel/plugin-proposal-class-properties", { loose: true }],
                ["@babel/plugin-proposal-private-methods", { loose: true }],
                [
                  "@babel/plugin-proposal-private-property-in-object",
                  { loose: true },
                ],
                [
                  "import", // babel-plugin-import 需要安装
                  { libraryName: "antd", libraryDirectory: "lib", style: true },
                  "antd",
                ],
                [
                  "import",
                  {
                    libraryName: "antd-mobile",
                    libraryDirectory: "lib",
                    style: true,
                  },
                  "antd-mobile",
                ],
              ].filter(Boolean),
            },
          },
          {
            test: /\.(less|css)$/,
            include: /src/,
            use: [
              {
                loader: MiniCssExtractPlugin.loader,
                options: {
                  esModule: true,
                  // modules: {
                  //   namedExport: true,
                  // },
                },
              },
              {
                loader: require.resolve("css-loader"),
                options: {
                  importLoaders: 2,
                  esModule: true,
                  modules: {
                    namedExport: true,
                    localIdentName: "[local]",
                  },
                },
              },
              {
                loader: require.resolve("postcss-loader"),
                options: {
                  postcssOptions: {
                    plugins: () => [
                      require("postcss-flexbugs-fixes"),
                      require("postcss-preset-env")({
                        autoprefixer: {
                          flexbox: "no-2009",
                        },
                        stage: 3,
                      }),
                      postcssNormalize(),
                    ],
                  },
                },
              },
              {
                loader: require.resolve("less-loader"),
                options: {
                  lessOptions: {
                    javascriptEnabled: true,
                  },
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(less|css)$/,
            include: /node_modules/,
            use: [
              {
                loader: "style-loader", // MiniCssExtractPlugin.loader,
              },
              {
                loader: "css-loader",
              },
              {
                loader: "less-loader",
                options: {
                  lessOptions: {
                    modifyVars,
                    javascriptEnabled: true,
                  },
                },
              },
            ],
            sideEffects: true,
          },
          {
            test: /\.(png|jpg|jpeg|gif)$/,
            type: "asset/resource",
            generator: {
              filename: "static/media/[name].[contenthash][ext]",
            },
          },
          {
            test: /\.(svg)$/,
            type: "asset/inline",
          },
          // {
          //   test: /\.svg$/i,
          //   type: "asset", // inline
          //   parser: {
          //     dataUrlCondition: {
          //       maxSize: 8 * 1024, // 默认就是8k
          //     },
          //   },
          //   generator: {
          //     filename: "static/media/[contenthash:8].svg",
          //     // dataUrl: (content) => {
          //     //   content = content.toString();
          //     //   return svgToMiniDataURI(content);
          //     // },
          //   },
          // },
          {
            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
            type: "asset/resource",
            generator: {
              filename: "static/media/[name].[contenthash][ext]",
            },
          },
        ],
      },
    ],
  },
};
