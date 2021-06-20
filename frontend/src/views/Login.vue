<template>
  <v-container fluid>
    <v-row
      justify="center"
    >
      <v-col
        cols="12"
        md="8"
        lg="4"
      >
        <v-alert
          v-if="alert.message"
          dense
          outlined
          :type="alert.type"
          close-text="Hide"
          dismissible
          @click="alert = {}"
        >
          {{ alert.message }}
        </v-alert>
        <v-card
          :loading="loading"
          class="mx-auto"
        >
          <v-card-title>
            Sign in into your account
          </v-card-title>

          <v-card-text>
            <sign-in
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SignIn from '@/components/auth/SignIn'

export default {
  name: 'Login',
  components: { SignIn },
  data: () => ({
    loading: false,
    alert: {
      type: 'error',
      message: 'Uh oh! This is an error!'
    }
  }),
  created () {
    if (this.isAuthenticated) {
      this.$router.push('home')
    }
  },
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    createAccount () {
      this.$router.push('register')
    },
    login (credentials) {
      this.loading = true
      console.log(credentials)
    },
    reset () {
      console.log('reset password')
    }
  }
}
</script>
