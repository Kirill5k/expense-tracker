<template>
  <v-menu
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
  }
}
</script>

<style lang="scss">
.options-selector {
  &__menu-header {
    margin-bottom: -10px;
  }

  &__menu {
    width: 176px;
  }
}
</style>
