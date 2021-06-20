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
        <v-card
          :loading="loading"
          class="mx-auto"
          max-width="400"
        >
          <v-card-title>
            Create new account
          </v-card-title>

          <v-card-text>
            <sign-up
              @sign-up="register"
            />
          </v-card-text>

          <v-divider></v-divider>

          <v-card-subtitle>
            Already have an account?
            <v-btn
              class="pl-0 pr-0"
              :style="{textTransform: 'unset'}"
              small
              color="primary"
              text
              @click="login"
            >
              Sign in.
            </v-btn>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SignUp from '@/components/auth/SignUp'

export default {
  name: 'Register',
  components: { SignUp },
  created () {
    if (this.isAuthenticated) {
      this.$router.push('home')
    }
  },
  data: () => ({
    loading: false
  }),
  computed: {
    isAuthenticated () {
      return this.$store.state.isAuthenticated
    }
  },
  methods: {
    login () {
      this.$router.push('login')
    },
    register (account) {
      console.log(account)
    }
  }
}
</script>
