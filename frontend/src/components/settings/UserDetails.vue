<template>
  <v-row>
    <v-col
      xs="3"
      sm="3"
      md="2"
      cols="3"
      class="pr-0 pt-0"
    >
      <v-icon
        size="76"
        dense
        :color="dark ? 'white' : 'black'"
        class="mx-auto"
      >
        mdi-account
      </v-icon>
    </v-col>
    <v-col
      xs="8"
      sm="8"
      md="8"
      cols="8"
      class="pl-0 pt-0"
    >
      <v-list>
        <v-list-item class="px-0">
          <v-list-item-content class="py-0 pl-4">
            <v-list-item-title class="mt-4 text-h6">
              {{ user.firstName }}
              {{ user.lastName }}
            </v-list-item-title>
            <v-list-item-subtitle>{{user.email}}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-col>
  </v-row>
</template>

<script>

export default {
  name: 'UserDetails',
  props: {
    dark: {
      type: Boolean,
      required: true
    },
    user: {
      type: Object,
      required: true
    }
  }
}
</script>
