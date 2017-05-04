var webpack = require('webpack'),
    BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    entry: {
        dashboard: './app/js/dashboard.js',
        vendor: [
            'react',
            'react-dom',
            // 'react-redux',
            // 'react-router',
            // 'react-tap-event-plugin',
            // 'redux',
            // 'redux-logger',
            // 'redux-promise',
            // 'redux-thunk'
        ]
    },
    output: {
        filename: '[name].js'
    },
    //This section is what folders are search for 'import'
    resolve: {
        alias: {
            'app': 'app/js/app.js'
        },
        modules: [
            './app/js',
            './app/components',
            './node_modules',
        ]
    },
    //We are telling it to use babel. Babel will search for .babelrc for settings.
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/ },
            { test: /\.jsx$/, loader: 'babel-loader', exclude: /node_modules/ }
        ]
    },
    plugins: [
        //Uncomment and run this for details on the bundle file sizes and details
        // new BundleAnalyzerPlugin({
        //     analyzerMode: 'static',
        //     reportFilename: 'bundle_report.html',
        //     openAnalyzer: true
        // }),

        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV)
            }
        }),

        new webpack.optimize.CommonsChunkPlugin({
            name: 'common',
            filename: 'common.js',
            chunks: ['dashboard'],
            Infinity
        }),

        // add vendor as parent of common
        new webpack.optimize.CommonsChunkPlugin({
            name: 'vendor',
            chunks: ['common'],
            Infinity
        }),
    ]
};