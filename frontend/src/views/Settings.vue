<template>
  <v-card
    :loading="loading"
    class="settings mx-auto"
    elevation="8"
  >
    <v-card-title class="pt-1 pb-1">
      Settings
    </v-card-title>

    <v-card-text class="pb-0 settings__details">
      <user-details
        :dark="$vuetify.theme.dark"
        :user="user"
      />
    </v-card-text>

    <v-divider/>

    <v-card-text class="pb-0">
      <p class="text-subtitle-1 mb-0">Interface</p>
      <interface-settings
        v-model="interfacePanel"
        :settings="user.settings"
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
import UserDetails from '@/components/settings/UserDetails'
import InterfaceSettings from '@/components/settings/InterfaceSettings'
import SecuritySettings from '@/components/settings/SecuritySettings'

export default {
  name: 'Settings',
  components: {
    UserDetails,
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
    user () {
      return this.$store.state.user
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
      this.dispatch('updateUserSettings', newSettings)
    },
    changePassword (newPassword) {
      this.dispatch('changeUserPassword', newPassword)
    }
  }
}
</script>

<style lang="scss">
.user {
  &__details {
    margin-top: 0px
  }
}
</style>
