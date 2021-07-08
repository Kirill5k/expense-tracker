<template>
  <v-card
    :loading="loading"
    class="account mx-auto"
    elevation="8"
  >
    <v-card-title>
      Account
    </v-card-title>

    <v-card-text class="pb-0">
      <account-details
        :account="account"
      />
    </v-card-text>

    <v-divider/>

    <v-card-text>
      <p class="text-subtitle-1 mb-0">Interface</p>
      <interface-settings
        v-model="interfacePanel"
        :account="account"
      />
    </v-card-text>

    <v-card-text class="pt-0">
      <p class="text-subtitle-1 mb-0">Security</p>
      <security-settings
        v-model="securityPanel"
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
    interfacePanel: undefined,
    securityPanel: undefined
  }),
  watch: {
    interfacePanel () {
      this.securityPanel = undefined
    },
    securityPanel () {
      this.interfacePanel = undefined
    }
  },
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
