import type { Configuration } from 'webpack';
import webpack from 'webpack';
import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

rules.push({
  test: /\.(woff|woff2|eot|ttf|otf)$/i,
  type: 'asset/resource',
});

rules.push({
  test: /\.svg/,
  issuer: /\.[jt]sx?$/,
  use: [{ loader: '@svgr/webpack' }],
});

rules.push({
  test: /\.png$/,
  type: 'asset/resource',
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
    fallback: {
      fs: false, // No direct usage of fs in renderer process
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
    },
  },
  devtool: 'source-map',
  target: 'electron-renderer', // Ensure we are targeting the electron-renderer environment
};
