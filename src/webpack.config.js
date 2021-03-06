const path = require('path')
const BundleTracker = require('webpack-bundle-tracker')

module.exports = {
    entry: path.join(__dirname, 'assets/src/index'),
    output: {
        path: path.join(__dirname, 'assets/dist'),
        filename: '[name]-[hash].js'
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"]
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)$/,
                loader: 'ts-loader',
                exclude: /node_modules/,
                options: {
                    configFile: path.join(__dirname, 'tsconfig.json')
                }
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            // {
            //     test: /\.(bmp|gif|jpeg|png|woff|woff2|eot|ttf|svg)$/,
            //     loader: 'url-loader',
            //     options: {
            //         limit: 10000,
            //         name: 'static/[name].[hash:8].[ext]'
            //     }
            // }
        ]
    },
    devtool: 'inline-source-map',
    plugins: [
        new BundleTracker({
            path: __dirname,
            filename: 'webpack-stats.json'
        })
    ]
}
