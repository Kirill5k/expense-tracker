<template>
  <v-container
    class="page mb-0 pb-0"
    fluid
  >
    <div
      v-if="loading"
      class="loading-spinner d-flex justify-center align-center"
      style="height: 70%"
    >
      <v-progress-circular
        size="70"
        width="7"
        color="primary"
        indeterminate
      />
    </div>
    <v-row justify="center" v-else>
      <v-col
        :cols="dimensions.cols"
        :xs="dimensions.xs"
        :sm="dimensions.sm"
        :md="dimensions.md"
        :lg="dimensions.lg"
      >
        <v-slide-y-transition>
          <v-alert
            class="mb-4"
            v-if="alert.message"
            dense
            outlined
            :type="alert.type"
            close-text="Hide"
            dismissible
            @click="$emit('clear-alert')"
          >
            {{ alert.message }}
          </v-alert>
        </v-slide-y-transition>
        <slot></slot>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
const REGULAR_DIMENSIONS = { cols: '12', xs: '9', sm: '6', md: '5', lg: '4' }
const SLIM_DIMENSIONS = { cols: '12', xs: '9', sm: '6', md: '4', lg: '3' }

export default {
  name: 'Page',
  props: {
    slim: {
      type: Boolean,
      default: false
    },
    alert: {
      type: Object,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    dimensions () {
      return this.slim ? SLIM_DIMENSIONS : REGULAR_DIMENSIONS
    }
  }
}
</script>

<style lang="scss">
.page {

}
</style>
