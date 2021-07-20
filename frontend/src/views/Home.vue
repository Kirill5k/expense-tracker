<template>
  <div>
    <p class="text-h1">Hello, World!</p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    register () {
      this.$router.push('/register')
    },
    login () {
      this.$router.push('/register')
    },
    reset () {
      console.log('reset password')
    }
  }
}
</script>

<style lang="scss">
.login {

}
</style>
