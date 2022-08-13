const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const base64url = require('base64url');
const crypto = require('crypto');
const fs = require('fs');

const MS_PER_DAY = 60 * 60 * 24 * 1000;

dotenv.config();
const HOSTNAME = process.env.HOSTNAME;

if (!HOSTNAME) {
    console.error('HOSTNAME environment variable was not set');
    process.exit(1);
}

dotenv.config();


function createSources() {
    var policies = {
	    "webrtc": "wss://" + HOSTNAME + "/ome-wss/tgrgbace/stream",
            "hls": "https://" + HOSTNAME + "/ome-hls/tgrgbace/stream/llhls.m3u8"
    };
    var sourcesObject = Object.entries(policies).map(function([key, value]) {
        var entry = {
            "type": key,
            "file": value,
            "label": key
        };

        if (key === "webrtc") {
            entry["default"] = true;
        }

        return entry;
    });

    var sourcesString = JSON.stringify(sourcesObject); 

    return sourcesString;
}

module.exports = {
    mode: 'development',
    entry: './src/index.js',
    plugins: [
        new webpack.DefinePlugin({
            __SOURCES__: createSources()
        }),
        new HtmlWebpackPlugin({
            title: 'TGRGBACE Live!',
            template: 'src/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: 'node_modules/ovenplayer/dist/*.js',
                    to: 'ovenplayer/[name][ext]' },
                { from: 'node_modules/hls.js/dist/hls.min.js',
                    to: 'deps/[name][ext]' }
            ]
        }),
    ],
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    resolve: {
        fallback: { 'crypto': false }  // Silence crypto polyfill warning.
    },
    performance: {
        hints: false  // Silence size warnings.
    },
};
