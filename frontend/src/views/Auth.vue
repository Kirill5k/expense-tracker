<template>
  <v-container fluid>
    <v-card
      :loading="loading"
      class="mx-auto"
      max-width="374"
    >
      <v-tabs
        color="deep-purple accent-4"
        center-active
      >
        <v-tab>Login</v-tab>
        <v-tab>Register</v-tab>

        <v-tab-item>
          <v-card-text>
            <sign-in />
          </v-card-text>
        </v-tab-item>

        <v-tab-item>
          <v-card-text>
            <sign-up />
          </v-card-text>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script>
import SignUp from '@/components/auth/SignUp'
import SignIn from '@/components/auth/SignIn'

export default {
  name: 'Auth',
  components: { SignUp, SignIn }
}
</script>
