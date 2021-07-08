<template>
  <v-card
    :loading="loading"
    class="account mx-auto"
    elevation="8"
  >
    <v-card-title>
      Account
    </v-card-title>

    <v-card-text>
      <account-details
        :account="account"
      />
      <v-divider/>
    </v-card-text>
  </v-card>
</template>

<script>
import AccountDetails from '@/components/account/AccountDetails'

export default {
  name: 'Account',
  components: {
    AccountDetails
  },
  data: () => ({
    loading: false,
    editable: false
  }),
  computed: {
    account () {
      return this.$store.state.account
    }
  }
}
</script>

<style lang="scss">
.account {

}
</style>
