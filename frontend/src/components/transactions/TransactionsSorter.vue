<template>
  <v-menu
    nudge-bottom="24"
    bottom
    left
    rounded="md"
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
          mdi-sort
        </v-icon>
      </v-btn>
    </template>

    <v-list
      dense
    >
      <v-subheader sense class="mb-0 ml-2 pb-0">Sort by</v-subheader>
      <v-list-item-group
        v-model="currentSort"
        mandatory
      >
        <v-list-item
          link
          dense
          v-for="(item, i) in sortOptions"
          :key="i"
          @click="$emit('sort', item.value)"
        >
          <v-list-item-title>{{ item.text }}</v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script>

export default {
  name: 'TransactionsSorter',
  data: () => ({
    currentSort: 0,
    sortOptions: [
      { text: 'Date (Newest First)', value: 'date-new' },
      { text: 'Date (Oldest First)', value: 'date-old' },
      { text: 'Amount (Highest First)', value: 'amount-high' },
      { text: 'Amount (Lowest First)', value: 'amount-low' }
    ]
  })
}
</script>
