<template>
  <v-container fluid>
    <hello-world />
  </v-container>
</template>

<script>
import HelloWorld from '@/components/HelloWorld'

export default {
  name: 'Home',
  components: {
    HelloWorld
  },
  created () {
    if (!this.isAuthenticated) {
      this.$router.push('login')
    }
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  }
}
</script>
