<template>
  <v-container
    class="page mb-0 pb-0"
    fluid
    style="height: 100%"
  >
    <v-snackbar
      class="mt-1"
      top
      :value="alert.show"
      :color="alert.type"
      :timeout="5000"
      @input="$emit('clear-alert')"
      elevation="12"
      transition="v-slide-y-transition"
    >
      {{ alert.message }}
      <template v-slot:action="{ attrs }">
        <v-btn
          color="white"
          text
          v-bind="attrs"
          @click="$emit('clear-alert')"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
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
    <v-row
      v-else
      justify="center"
      style="height: 70%"
    >
      <v-col
        v-if="navbar"
        cols="2"
        sm="3"
        md="2"
        class="d-none d-sm-block"
      >
        <v-card
          elevation="8"
          width="256"
        >
          <v-navigation-drawer
            floating
            permanent
          >
            <v-list dense>
              <v-list-item
                v-for="link in navLinks"
                :key="link.to"
                :to="link.to"
                link
              >
                <v-list-item-icon>
                  <v-icon>{{ link.icon }}</v-icon>
                </v-list-item-icon>

                <v-list-item-content>
                  <v-list-item-title>{{ link.name }}</v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </v-navigation-drawer>
        </v-card>
      </v-col>
      <v-col
        :cols="dimensions.cols"
        :xs="dimensions.xs"
        :sm="dimensions.sm"
        :md="dimensions.md"
        :lg="dimensions.lg"
        :align-self="slim ? 'center' : 'baseline'"
      >
        <slot></slot>
      </v-col>
      <v-col
        v-if="navbar"
        cols="2"
        class="d-none d-sm-block"
      />
    </v-row>
  </v-container>
</template>

<script>
const REGULAR_DIMENSIONS = { cols: '12', xs: '9', sm: '7', md: '5', lg: '4' }
const SLIM_DIMENSIONS = { cols: '12', xs: '9', sm: '6', md: '4', lg: '3' }
const WIDE_DIMENSIONS = { cols: '12', xs: '12', sm: '10', md: '10', lg: '10' }

export default {
  name: 'Page',
  props: {
    navbar: {
      type: Boolean,
      default: false
    },
    wide: {
      type: Boolean,
      default: false
    },
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
    },
    navLinks: {
      type: Array,
      required: true
    }
  },
  computed: {
    dimensions () {
      if (this.wide) {
        return WIDE_DIMENSIONS
      } else if (this.slim) {
        return SLIM_DIMENSIONS
      } else {
        return REGULAR_DIMENSIONS
      }
    }
  }
}
</script>

<style lang="scss">
.page {

}
</style>
