const {defineConfig} = require('@vue/cli-service')
const {BundleAnalyzerPlugin} = require('webpack-bundle-analyzer')
const CompressionPlugin = require('compression-webpack-plugin');
//判断是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';
//const isProduction = true;
//定义 CDN 路径
const cdn = {
    css: [

    ],
    js: [
        'https://cdn.staticfile.org/vue/2.6.14/vue.min.js',
        'https://cdn.staticfile.org/vue-router/3.5.3/vue-router.min.js',
        'https://cdn.staticfile.org/vuex/3.6.2/vuex.min.js',
        'https://cdn.staticfile.org/axios/1.11.0/axios.min.js',
        'https://cdn.staticfile.org/moment.js/2.30.1/moment.min.js',
        'https://cdn.staticfile.org/lodash.js/4.17.21/lodash.min.js',
        'https://cdn.staticfile.org/video.js/7.18.1/video.min.js',
        'https://cdn.staticfile.org/dplayer/1.26.0/DPlayer.min.js',
    ]
}
module.exports = defineConfig({
    publicPath: '/myvideo/',
    lintOnSave: false,
    transpileDependencies: true,
    productionSourceMap: !isProduction,
    devServer: {
        proxy: {
            '/loadVideo': {
                target: 'https://r2.jzacg.com',
                changeOrigin: true,
                pathRewrite: {
                    '^/loadVideo': ''
                }
            },
            '/loadVideo2': {
                target: 'https://play.mknacg.top:9009',
                changeOrigin: true,
                pathRewrite: {
                    '^/loadVideo2': ''
                }
            },
        },
        client: {
            // 报错提示 是否铺满全屏
            overlay: false
        }
    },
    chainWebpack: (config) => {
        // 更改初次启动，显示的网站标题
        config.plugin('html').tap((args) => {
            args[0].title = 'blue的video'
            return args;
        }).end();

        if (isProduction) {
            // 生产环境注入 cdn
            config.plugin('html').tap(args => {
                args[0].cdn = cdn;
                return args;
            }).end();
            ;
        }
    },

    configureWebpack: {
        plugins: [
            new CompressionPlugin({
                filename: '[path][base].gz[query]', // 使得多个.gz文件合并成一个文件，这种方式压缩后的文件少，建议使用，默认是：[path][base].gz
                algorithm: 'gzip', // 默认压缩算法是gzip
                test: /\.js$|\.css$|\.html$|\.ttf$|\.eot$|\.woff$/, // 使用正则给匹配到的文件做压缩，这里是给html、css、js以及字体（.ttf和.woff和.eot）做压缩
                threshold: 10240, // 以字节为单位压缩超过此大小的文件，使用默认值10240吧
                minRatio: 0.8, // 最小压缩比率，官方默认0.8
                // 是否删除原有静态资源文件，即只保留压缩后的.gz文件，建议这个置为false，还保留源文件。以防假如出现访问.gz文件访问不到的时候，还可以访问源文件双重保障
                deleteOriginalAssets: false
            }),
            new BundleAnalyzerPlugin({
                openAnalyzer: false
            }),

        ],
        // 只有生产环境下排除打包下面依赖
        externals: isProduction && {
            // package 依赖里的名字： js文件暴露的名字
            'axios': 'axios',
            'vue-router': 'VueRouter',
            'vue': 'Vue',
            'vuex': 'Vuex',
            'dplayer': 'DPlayer',
            'lodash': '_',
        } || {}
    }
})
