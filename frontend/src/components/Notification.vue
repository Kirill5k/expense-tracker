<template>
  <v-container
    class="transactions mb-0 pb-0"
    fluid
  >
    <v-row
      class="notification"
      justify="center"
    >
      <v-col
        cols="12"
        xs="9"
        sm="6"
        md="4"
        lg="3"
      >
        <v-slide-y-transition>
          <v-alert
            class="mb-0"
            v-if="message"
            dense
            outlined
            :type="type"
            close-text="Hide"
            dismissible
            @click="$emit('clear')"
          >
            {{ message }}
          </v-alert>
        </v-slide-y-transition>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Notification',
  props: {
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      default: 'error'
    }
  }
}
</script>

<style lang="scss">
.notification {

  &__alert {
    display: flex;
    flex-direction: column-reverse;
  }
}
</style>
