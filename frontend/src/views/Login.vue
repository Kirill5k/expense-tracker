<template>
  <v-container
    class="login"
    fluid
  >
    <v-row
      justify="center"
    >
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="4"
        lg="3"
      >
        <div class="login__alert">
          <v-alert
            v-if="error"
            dense
            outlined
            type="error"
            close-text="Hide"
            dismissible
            @click="error = ''"
          >
            {{ error }}
          </v-alert>
        </div>
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
      this.error = ''
      this.$store
        .dispatch('login', credentials)
        .then(() => this.$router.push('/'))
        .catch(err => {
          this.loading = false
          this.error = err.toString()
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

  &__alert {
    display: flex;
    flex-direction: column-reverse;
    height: 100px;
  }
}
</style>
