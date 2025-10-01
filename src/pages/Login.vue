<template>
  <div style="display: flex; justify-content: center;">
    <input v-model="user" @keyup.enter="login"/>
    <button @click="login">登录</button>
  </div>
</template>

<script>
export default {
  name: "Login",
  data(){
    return {
      user: ""
    }
  },
  methods:{
    login(){
      console.log(this.user);
      this.$router.push({
        name: 'VideoHome',
        query: {
          user: this.user
        }
      })
    }
  }
}
</script>

<style scoped>

</style>
