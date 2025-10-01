import Vue from 'vue'
import Vuex from 'vuex'  // 3.6.2

import videoOption from "@/store/video"

Vue.use(Vuex)
export default new Vuex.Store({
    modules: {
        videoOption,
    }
})
