<template>
  <v-app>
    <v-app-bar
      v-if="isAuthenticated"
      app
      color="white"
    >
      <v-avatar
        color="primary"
      >
        <span class="white--text text-h5">{{initials}}</span>
      </v-avatar>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-main class="grey lighten-3">
      <div
        v-if="loading"
        class="d-flex justify-center align-center"
        style="height: 50%"
      >
        <v-progress-circular
          size="70"
          width="7"
          color="primary"
          indeterminate
        />
      </div>
      <router-view
        v-else
      />
    </v-main>
  </v-app>
</template>

<script>

export default {
  name: 'App',
  created () {
    this.$store
      .dispatch('getAccount')
      .then(() => {
        this.$router.push('/')
        this.loading = false
      })
      .catch(() => {
        this.$router.push('/login')
        this.loading = false
      })
  },
  data: () => ({
    loading: true
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    initials () {
      if (this.isAuthenticated) {
        const acc = this.$store.state.account
        const initials = acc.firstName.charAt(0) + acc.lastName.charAt(0)
        return initials.toUpperCase()
      } else {
        return ''
      }
    }
  }
}
</script>
