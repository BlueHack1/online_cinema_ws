import http from '../utils/request'

export function getPlayList (user, id){
   return  http.get('/video', {
        params: {
            user,
            id
        }
    })
}


/**
 *
 * @param user
 * @param id 播放列表 id ，一般是空，请求的 是某个网站的
 * @param comic_info
 * @returns {Promise<AxiosResponse<any>>}
 */
export function refreshPlayList (user, id, comic_info){
    return  http.get('/refreshVideo', {
        params: {
            user,
            id,
            ...comic_info
        }
    })
}

export  let gryy = ()=> {}

