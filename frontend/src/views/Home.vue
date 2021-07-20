<template>
  <div>
    <p class="text-h2">Hello, World!</p>
  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    register () {
      this.$router.push('/register')
    }
  }
}
</script>

<style lang="scss">
.login {

}
</style>
