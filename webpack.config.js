require('babel-core/register');
const webpack = require('webpack');
const path = require('path');

const src  = path.resolve(__dirname, 'src');
const dist = path.resolve(__dirname, 'dist');

module.exports = () => ({
    entry: `${src}/index.js`,

    output: {
        path: dist,
        filename: 'bundle.js',
    },

    module: {
        loaders: [
            {
                test: /\.(glsl|vert|frag)$/,
                exclude: /\.(njk|nunjucks)\.(glsl|vert|frag)$/,
                loader: 'shader-loader',
            },
            {
                test: /\.(njk|nunjucks)\.(glsl|vert|frag)$/,
                loader: 'nunjucks-loader',
                query: {
                    root: `${__dirname}/src`,
                },
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
            }
        ],
    },

    devtool: (process.env.NODE_ENV === 'production') ? false : 'inline-source-map',

    resolve: {
        extensions: ['.js'],
    },

    devServer: {
        contentBase: 'dist',
        port: 3000,
    },

    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
        }),
    ],
});
