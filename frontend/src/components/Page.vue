<template>
  <v-container
    class="page mb-0 pb-0"
    fluid
  >
    <v-row justify="center">
      <v-col
        :cols="dimensions.cols"
        :xs="dimensions.xs"
        :sm="dimensions.sm"
        :md="dimensions.md"
        :lg="dimensions.lg"
      >
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
