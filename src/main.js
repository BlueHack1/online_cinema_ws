import Vue from 'vue'
import App from './App.vue'
import VueRouter from "vue-router"; //3.6.5


Vue.config.productionTip = false
Vue.config.devtools = true;
Vue.config.productionTip = false;

Vue.use(VueRouter);

import router from './router/index';
import store from './store';

new Vue({
  render: h => h(App),
  router,
  store
}).$mount('#app')
