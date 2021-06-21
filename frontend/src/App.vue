<template>
  <v-app>
    <v-app-bar
      v-if="isAuthenticated"
      app
      color="white"
    >
      <v-avatar
        color="primary"
        size="48"
      >
        <span
          class="white--text text-h6"
        >
          {{initials}}
        </span>
      </v-avatar>

      <v-spacer></v-spacer>

    </v-app-bar>

    <v-main class="grey lighten-3">
      <div
        v-if="isLoading"
        class="d-flex justify-center align-center"
        style="height: 70%"
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
      .then(() => this.$router.push('/'))
      .catch(() => this.$router.push('/login'))
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    },
    isLoading () {
      return this.$store.state.isLoading
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
