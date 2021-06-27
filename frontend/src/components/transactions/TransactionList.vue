<template>
  <v-list dense>
    <v-list-item
      dense
      v-if="!items.length"
    >
      <v-list-item-subtitle
        class="text-center"
      >
        No transactions for this period
      </v-list-item-subtitle>
    </v-list-item>
    <v-virtual-scroll
      :items="items"
      max-height="840"
      item-height="70"
      bench="3"
    >
      <template v-slot:default="{ item }">
        <v-list-item
          class="px-1"
          :key="`${item.id}${categories[item.categoryId]}`"
          link
        >
          <v-list-item-avatar
            size="28"
            class="mt-0"
          >
            <v-icon
              outline
              class="black lighten-10"
              dark
            >
              {{ categories[item.categoryId].icon }}
            </v-icon>
          </v-list-item-avatar>

          <v-list-item-content>
            <v-list-item-title v-text="categories[item.categoryId].name"/>
            <v-list-item-subtitle class="text--secondary font-weight-medium" v-text="item.note"/>
            <v-list-item-subtitle v-text="formatTxDate(item)" class="font-weight-light"/>
            <p v-if="!item.note"></p>
          </v-list-item-content>

          <v-list-item-action
            class="mt-0"
          >
            <v-chip
              small
              outlined
              :color="item.kind === 'expense' ? 'pink' : 'success'"
            >
              {{ formatTxAmount(item) }}
            </v-chip>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>
      </template>
    </v-virtual-scroll>
  </v-list>
</template>

<script>
const CURRENCY_SYMBOLS = {
  GBP: '£',
  EUR: '€',
  USD: '$'
}

export default {
  name: 'TransactionList',
  props: {
    items: {
      type: Array,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    categories: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    selectedItem: null
  }),
  methods: {
    formatTxAmount (tx) {
      const sign = tx.kind === 'expense' ? '-' : '+'
      const symbol = CURRENCY_SYMBOLS[tx.amount.currency]
      return `${sign} ${symbol}${tx.amount.value}`
    },
    formatTxDate (tx) {
      const date = new Date(tx.date)
      return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }
  }
}
</script>
