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
const HMAC_KEY = process.env.HMAC_KEY;
const HOSTNAME = process.env.HOSTNAME;

if (!HMAC_KEY) {
    console.error('HMAC_KEY environment variable was not set');
    process.exit(1);
}

if (!HOSTNAME) {
    console.error('HOSTNAME environment variable was not set');
    process.exit(1);
}

dotenv.config();


function createSources() {
    var streamerPolicyExpiration, viewerPolicyExpiration;
    if (process.env.STREAMER_EXP) {
        streamerPolicyExpiration = parseInt(process.env.STREAMER_EXP);
        console.log('Using streamer policy from environment');
    } else {
        streamerPolicyExpiration = Date.now() + (60 * MS_PER_DAY);
        console.log('Created new streamer policy expiration');
    }

    if (process.env.VIEWER_EXP) {
        viewerPolicyExpiration = parseInt(process.env.VIEWER_EXP);
        console.log('Using viewer policy from environment');
    } else {
        viewerPolicyExpiration = Date.now() + (365 * MS_PER_DAY);
        console.log('Created new viewer policy expiration');
    }

    console.log('streamer expiration: ' + new Date(streamerPolicyExpiration));
    console.log('viewer expiration: ' + new Date(viewerPolicyExpiration));
    console.log();
    console.log('.env file');
    console.log('HMAC_KEY=' + HMAC_KEY);
    console.log('HOSTNAME=' + HOSTNAME);
    console.log('STREAMER_EXP=' + streamerPolicyExpiration);
    console.log('VIEWER_EXP=' + viewerPolicyExpiration);
    console.log();

    let streamerPolicy = JSON.stringify({"url_expire": streamerPolicyExpiration });
    let viewerPolicy = JSON.stringify({"url_expire": viewerPolicyExpiration });

    let streamerPolicyBase64 = base64url(Buffer.from(streamerPolicy, 'utf8'));
    let viewerPolicyBase64 = base64url(Buffer.from(viewerPolicy, 'utf8'));

    var policies = {};
    makePolicy(policies, 'webrtc', HMAC_KEY, 'wss://wss.' + HOSTNAME + "/tgrgbace/stream", 'ws://wss.' + HOSTNAME + ":3333/tgrgbace/stream", viewerPolicyBase64);
    makePolicy(policies, 'hls', HMAC_KEY, 'https://hls.' + HOSTNAME + "/tgrgbace/stream/llhls.m3u8", 'http://hls.' + HOSTNAME + ":80/tgrgbace/stream/playlist.m3u8", viewerPolicyBase64);
    //no longer supported
    //makePolicy(policies, 'dash-ll', HMAC_KEY, 'https://hls.' + HOSTNAME + "/tgrgbace/stream/manifest_ll.mpd", 'http://hls.' + HOSTNAME + ":80/tgrgbace/stream/manifest_ll.mpd", viewerPolicyBase64);

    var streamerPolicies = {};
    makePolicy(streamerPolicies, 'rtmp', HMAC_KEY, 'rtmp://' + HOSTNAME + ":1935/tgrgbace/stream", 'rtmp://' + HOSTNAME + ":1935/tgrgbace/stream", streamerPolicyBase64);
    makePolicy(streamerPolicies, 'srt', HMAC_KEY, 'srt://' + HOSTNAME + ":9999/tgrgbace/stream", 'srt://' + HOSTNAME + ":9999/tgrgbace/stream", streamerPolicyBase64);

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

    console.log('********************************');
    console.log();
    console.log('INFO FOR STREAMERS');
    console.log('==================');
    console.log();
    for (const [key, value] of Object.entries(streamerPolicies)) {
        console.log(key + ' streaming URL: ' + value);
    }
    console.log();
    console.log('NOTE: Anyone who knows one of these URLS can broadcast to the stream. Handle with care.');
    console.log();
    console.log();
    console.log('INFO FOR VIEWERS');
    console.log('================');
    console.log();
    console.log('Secret player URL: https://' + HOSTNAME + '/tgrgbace/index.html');
    console.log();
    console.log('********************************');
    console.log();

    //console.log(sourcesString);

    return sourcesString;
}

function makePolicy(policies, protocol, hmacKey, baseUrl, policyBaseUrl, policyBase64) {
    var policyUrl = policyBaseUrl + '?policy=' + policyBase64;
    var signature = base64url(crypto.createHmac('sha1', hmacKey).update(policyUrl).digest());
    var signedUrl = baseUrl + '?policy=' + policyBase64 + '&signature=' + signature;
    //srt is real special
    if (protocol == "srt") {
        policies[protocol] = "srt://" + HOSTNAME + ":9999?streamid=" + encodeURIComponent(signedUrl);
    } else {
        policies[protocol] = signedUrl;
    }
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
                //{ from: 'node_modules/dashjs/dist/dash.all.min.js',
                //    to: 'deps/[name][ext]' }
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
