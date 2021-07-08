<template>
  <v-expansion-panels
    accordion
    flat
  >
    <v-expansion-panel
      @change="resetPasswordChangeForm"
    >
      <v-expansion-panel-header class="px-0">
        <template v-slot:default="{ }">
          <v-row no-gutters>
            <v-col cols="8">
              Change password
            </v-col>
          </v-row>
        </template>
      </v-expansion-panel-header>
      <v-expansion-panel-content>
        <v-form
          ref="passwordChangeForm"
          v-model="valid"
          lazy-validation
        >
          <v-text-field
            dense
            tabindex="1"
            name="currentPassword"
            autocomplete="new-password"
            v-model="currentPassword"
            :append-icon="showCurrentPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="rules.password"
            :type="showCurrentPassword ? 'text' : 'password'"
            label="Current password"
            @click:append="showCurrentPassword = !showCurrentPassword"
            hint="Must be at least 8 characters including a number and an uppercase letter"
          />

          <v-text-field
            dense
            tabindex="2"
            name="newPassword"
            autocomplete="new-password"
            v-model="newPassword"
            :append-icon="showNewPassword ? 'mdi-eye' : 'mdi-eye-off'"
            :rules="rules.newPassword"
            :type="showNewPassword ? 'text' : 'password'"
            label="New password"
            @click:append="showNewPassword = !showNewPassword"
            hint="Must be at least 8 characters including a number and an uppercase letter"
          />

          <v-text-field
            dense
            tabindex="3"
            name="confirmPassword"
            autocomplete="new-password"
            v-model="confirmPassword"
            :rules="rules.confirmPassword"
            type="password"
            label="Confirm password"
            required
          />

          <v-btn
            small
            tabindex="4"
            color="success"
            @click="updatePassword"
          >
            Change
          </v-btn>
        </v-form>
      </v-expansion-panel-content>
    </v-expansion-panel>

  </v-expansion-panels>
</template>

<script>
export default {
  name: 'SecuritySettings',
  data: () => ({
    valid: true,
    showCurrentPassword: false,
    showNewPassword: false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }),
  computed: {
    rules () {
      return {
        password: [
          v => !!v || 'Please enter your current password'
        ],
        newPassword: [
          v => !!v || 'Please enter your new password',
          v => v.length >= 8 || 'Must be at least 8 characters in length',
          v => /[A-Z].*\d|\d.*[A-Z]/.test(v) || 'Must contain at least 1 digit and 1 uppercase letter',
          v => v.length < 60 || 'Your new password is too long'
        ],
        confirmPassword: [
          v => !!v || 'Please confirm your new password',
          v => v === this.newPassword || 'Passwords do not match'
        ]
      }
    }
  },
  methods: {
    resetPasswordChangeForm () {
      if (this.$refs.passwordChangeForm) {
        this.currentPassword = ''
        this.newPassword = ''
        this.confirmPassword = ''
        this.$refs.passwordChangeForm.resetValidation()
      }
    },
    updatePassword () {
      if (this.$refs.passwordChangeForm.validate()) {
        const passwordChange = {
          password: this.currentPassword,
          newPassword: this.newPassword
        }
        this.$emit('update-password', passwordChange)
      }
    }
  }
}
</script>
