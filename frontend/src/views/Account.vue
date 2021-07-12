<template>
  <v-card
    :loading="loading"
    class="account mx-auto"
    elevation="8"
  >
    <v-card-title class="pt-1">
      Account
    </v-card-title>

    <v-card-text class="pb-0 account__details">
      <account-details
        :dark="$vuetify.theme.dark"
        :account="account"
      />
    </v-card-text>

    <v-divider/>

    <v-card-text class="pb-0">
      <p class="text-subtitle-1 mb-0">Interface</p>
      <interface-settings
        v-model="interfacePanel"
        :settings="account.settings"
        @update="updateSettings"
      />
    </v-card-text>

    <v-card-text class="py-0">
      <p class="text-subtitle-1 mb-0">Security</p>
      <security-settings
        :loading="loading"
        v-model="securityPanel"
        @change-password="changePassword"
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
  },
  methods: {
    dispatch (action, args) {
      this.loading = true
      this.$store
        .dispatch(action, args)
        .catch(() => {})
        .then(() => {
          this.loading = false
        })
    },
    updateSettings (newSettings) {
      this.dispatch('updateAccountSettings', newSettings)
    },
    changePassword (newPassword) {
      this.dispatch('changeAccountPassword', newPassword)
    }
  }
}
</script>

<style lang="scss">
.account {
  &__details {
    margin-top: -24px
  }
}
</style>
