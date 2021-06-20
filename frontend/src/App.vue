<template>
  <v-app>
    <v-app-bar
      app
      color="white"
    >
      <v-avatar
        v-if="isAuthenticated"
        color="primary"
      >
        <span class="white--text text-h5">{{initials}}</span>
      </v-avatar>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-main class="grey lighten-3">

      <router-view
        v-if="isAuthenticated"
      />
      <login
        v-else
      />
    </v-main>
  </v-app>
</template>

<script>
import Login from '@/views/Login'

export default {
  name: 'App',
  created () {
    this.$store.dispatch('getAccount')
  },
  components: { Login },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    initials () {
      if (this.isAuthenticated) {
        const acc = this.$store.account
        const initials = acc.firstName.charAt(0) + acc.lastName.charAt(0)
        return initials.toUpperCase()
      } else {
        return ''
      }
    }
  }
}
</script>
