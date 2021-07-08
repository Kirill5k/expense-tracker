<template>
  <v-row>
    <v-col
      xs="4"
      sm="4"
      md="3"
      cols="4"
      class="pr-0 pt-0"
    >
      <v-icon
        size="100"
        dense
        color="black"
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
          <v-list-item-content class="py-0">
            <v-list-item-title class="mt-9 text-h6">
              {{ account.firstName }}
              {{ account.lastName }}
            </v-list-item-title>
            <v-list-item-subtitle>{{account.email}}</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-col>
  </v-row>
</template>

<script>

export default {
  name: 'AccountDetails',
  props: {
    account: {
      type: Object,
      required: true
    }
  }
}
</script>
