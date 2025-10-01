<template>
  <div id="app" :class="['container', mode]">
    <div style="display: flex; justify-content: center;">
      <button @click="toggleMode" :class="['custom-style', mode]">{{ mode === 'dark' ? '切换到白色模式' : '切换到暗黑模式' }}
      </button>
    </div>
    <router-view></router-view>
  </div>
</template>
<script>
export default {
  name: 'App',
  data(){
    return {
      mode: "light"
    }
  },
  methods:{
    toggleMode() {
      // 切换模式
      this.mode = this.mode === 'light' ? 'dark' : 'light';
      if (this.mode === 'dark') {
        document.documentElement.style.setProperty('--background-color', '#121212');
        document.documentElement.style.setProperty('--text-color', 'white');
      } else {
        document.documentElement.style.setProperty('--background-color', 'white');
        document.documentElement.style.setProperty('--text-color', 'black');
      }
    },
  }

}
</script>

<style>

/* 全局的 CSS 变量 */
:root {
  --background-color: white;
  --text-color: black;
}

body {
  background-color: var(--background-color); /* 使用 CSS 变量 */
  color: var(--text-color); /* 使用 CSS 变量 */
  margin: 0;
}

button.custom-style {
  margin-top: 10px;
  margin-left: 10px;
  margin-bottom: 10px;
  font-size: 21px;
  background-color: var(--background-color); /* 使用 CSS 变量 */
  color: var(--text-color); /* 使用 CSS 变量 */
}

</style>
