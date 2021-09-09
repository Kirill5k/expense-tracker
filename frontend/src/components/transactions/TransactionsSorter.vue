<template>
  <options-selector
    header="Sort by"
    icon="mdi-sort"
  >
    <v-list-item-group
      :value="sortBy.index"
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
  props: {
    sortBy: {
      type: Object,
      required: true
    }
  },
  created () {
    if (!this.sortBy.field) {
      this.$emit('sort', this.sortOptions[0])
    }
  },
  data: () => ({
    sortOptions: [
      { text: 'Date (Newest First)', value: { field: 'date', desc: true, index: 0 } },
      { text: 'Date (Oldest First)', value: { field: 'date', desc: false, index: 1 } },
      { text: 'Amount (Highest First)', value: { field: 'amount', desc: false, index: 2 } },
      { text: 'Amount (Lowest First)', value: { field: 'amount', desc: true, index: 3 } }
    ]
  })
}
</script>
