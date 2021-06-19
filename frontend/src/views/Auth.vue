<template>
  <v-container fluid>
    <v-card
        :loading="loading"
        class="mx-auto"
        max-width="374"
      >
      <v-tabs
        color="deep-purple accent-4"
      >
        <v-tab>Login</v-tab>
        <v-tab>Register</v-tab>

        <v-tab-item
          v-for="n in 2"
          :key="n"
        >
          <v-container fluid>
            <v-row>
              <v-col
                v-for="i in 6"
                :key="i"
                cols="12"
                md="4"
              >
                {{ n }}
              </v-col>
            </v-row>
          </v-container>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script>
// import SignUp from '@/components/auth/SignUp'
// import SignIn from '@/components/auth/SignIn'

export default {
  name: 'Auth'
}
</script>
