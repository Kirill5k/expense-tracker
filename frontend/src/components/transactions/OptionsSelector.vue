<template>
  <v-bottom-sheet
    class="options-selector"
    v-if="$vuetify.breakpoint.xsOnly"
    v-model="sheet"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        class="mr-1"
        elevation="2"
        x-small
        text
        rounded
        plain
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          {{ icon }}
        </v-icon>
      </v-btn>
    </template>
    <v-list
      class="options-selector__sheet"
      dense
    >
      <v-subheader class="options-selector__sheet-header ml-2 pb-0">{{header}}</v-subheader>
      <slot></slot>
    </v-list>
  </v-bottom-sheet>
  <v-menu
    v-else
    class="options-selector"
    nudge-bottom="24"
    bottom
    left
    rounded="md"
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        class="mr-1"
        elevation="2"
        x-small
        text
        rounded
        plain
        v-bind="attrs"
        v-on="on"
      >
        <v-icon>
          {{ icon }}
        </v-icon>
      </v-btn>
    </template>

    <v-list
      class="options-selector__menu"
      dense
    >
      <v-subheader class="options-selector__menu-header ml-2 pb-0">{{header}}</v-subheader>
      <slot></slot>
    </v-list>
  </v-menu>
</template>

<script>

export default {
  name: 'OptionsSelector',
  props: {
    header: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    }
  },
  data: () => ({
    sheet: false
  })
}
</script>

<style lang="scss">
.options-selector {
  &__menu {
    width: 176px;
  }
}
</style>
