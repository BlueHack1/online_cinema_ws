import axios from 'axios'
import errorCode from '@/utils/errorCode'

axios.defaults.headers['Content-Type'] = 'application/json;charset=utf-8'
console.log(process.env.VUE_APP_URL)
// 创建axios实例
const service = axios.create({
    // axios中请求配置有baseURL选项，表示请求URL公共部分
    baseURL: process.env.VUE_APP_URL,
    //baseURL: "https://api.blue6.top",
    // 超时
    timeout: 10000
})
// request拦截器
service.interceptors.request.use(config => {

    // get请求映射params参数
    if (config.method === 'get' && config.params) {
        let url = config.url + '?'
        for (const propName of Object.keys(config.params)) {
            const value = config.params[propName]
            let part = encodeURIComponent(propName) + '='
            if (value !== null && typeof (value) !== 'undefined') {
                if (typeof value === 'object') {
                    for (const key of Object.keys(value)) {
                        if (value[key] !== null && typeof (value[key]) !== 'undefined') {
                            const params = propName + '[' + key + ']'
                            const subPart = encodeURIComponent(params) + '='
                            url += subPart + encodeURIComponent(value[key]) + '&'
                        }
                    }
                } else {
                    url += part + encodeURIComponent(value) + '&'
                }
            }
        }
        url = url.slice(0, -1)
        config.params = {}
        config.url = url
    }
    return config
}, error => {
    console.warn("请求出错：", error)
    return Promise.reject(error)
})

// 响应拦截器
service.interceptors.response.use(res => {
        // 未设置状态码则默认成功状态
        const code = res.data.code || 200

        // 获取错误信息
        const msg = errorCode[code] || res.data.msg || errorCode['default']
        if (code === 401) {
            return Promise.reject("user_error");
        } else if (code === 500) {
            return Promise.reject(new Error(msg))
        } else if (code !== 200) {
            return Promise.reject('error')
        } else {
            // 把字符串total 转换成 数字 total
            if (res.data.data && res.data.data.total) {
                res.data.data.total = parseInt(res.data.data.total)
            }
        }
        return Promise.resolve(res.data.data);
    },
    error => {
        console.error('响应出错：' + error)

        return Promise.reject(error);
    }
)

export default service
