import VueRouter from 'vue-router';

const routes = [
    {
        path: "/video",
        name: "VideoHome",
        // 访问根路径，加载下主页组件
        component: () => import('@/pages/Index'),
        props(route) {
            return {
                user: route.query.user
            }
        },
        meta:{
            requireAuth: true
        }
    },
    {
        path: "/",
        name: "login",
        component: () => import('@/pages/Login')
    },
]
const router = new VueRouter({
    routes,
    mode: 'history',
    base: '/myvideo/'  // 这里必须和你部署的二级路径一致，且末尾有 /
})

router.beforeEach((to, from, next) =>{
    if(to.matched.some(record => record.meta.requireAuth)){
        // 需要登录
        // next({name: "login"})
        next()
    } else {
        next()
    }

})
export default router;
