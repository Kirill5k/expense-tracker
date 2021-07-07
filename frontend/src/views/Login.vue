<template>
  <v-card
    :loading="loading"
    class="mx-auto"
  >
    <v-card-title>
      Sign in into your account
    </v-card-title>

    <v-card-text>
      <sign-in
        :disabled="loading"
        @sign-in="login"
        @reset-password="reset"
      />
    </v-card-text>

    <v-divider></v-divider>

    <v-card-subtitle>
      New?
      <v-btn
        class="pl-0 pr-0"
        :style="{textTransform: 'unset'}"
        small
        color="primary"
        text
        @click="createAccount"
      >
        Create an account.
      </v-btn>
    </v-card-subtitle>
  </v-card>
</template>

<script>
import SignIn from '@/components/auth/SignIn'

export default {
  name: 'Login',
  components: { SignIn },
  data: () => ({
    loading: false,
    error: ''
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    createAccount () {
      this.$router.push('/register')
    },
    login (credentials) {
      this.loading = true
      this.$store.commit('clearAlert')
      this.$store
        .dispatch('login', credentials)
        .then(() => this.$router.push('/'))
        .catch(() => {
          this.loading = false
        })
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
