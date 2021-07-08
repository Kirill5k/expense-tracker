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

    <v-card-text class="pt-0">
      <p class="text-subtitle-1 mb-0">Interface</p>
      <interface-settings
        :account="account"
      />
    </v-card-text>

    <v-card-text class="pt-0">
      <p class="text-subtitle-1 mb-0">Security</p>
      <security-settings
      />
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        small
        outlined
        @click="$store.dispatch('logout')"
      >
        <v-icon left dark>mdi-logout</v-icon>
        Sign out
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import AccountDetails from '@/components/account/AccountDetails'
import InterfaceSettings from '@/components/account/InterfaceSettings'
import SecuritySettings from '@/components/account/SecuritySettings'

export default {
  name: 'Account',
  components: {
    AccountDetails,
    InterfaceSettings,
    SecuritySettings
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
