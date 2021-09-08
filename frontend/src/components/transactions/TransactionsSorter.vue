<template>
  <options-selector
    header="Sort by"
    icon="mdi-sort"
  >
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
  </options-selector>
</template>

<script>
import OptionsSelector from '@/components/transactions/OptionsSelector'

export default {
  name: 'TransactionsSorter',
  components: { OptionsSelector },
  data: () => ({
    currentSort: 0,
    sortOptions: [
      { text: 'Date (Newest First)', value: { field: 'date', desc: true } },
      { text: 'Date (Oldest First)', value: { field: 'date', desc: false } },
      { text: 'Amount (Highest First)', value: { field: 'amount', desc: false } },
      { text: 'Amount (Lowest First)', value: { field: 'amount', desc: true } }
    ]
  })
}
</script>
