<template>
  <v-data-table
    class="transactions-breakdown"
    :headers="headers"
    :items="breakdown"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    :headers-length="2"
    no-data-text="No transactions for this period"
    disable-pagination
    mobile-breakpoint="100"
  >
    <template v-slot:item.tx="{ item }">
      <v-list-item>
        <v-list-item-avatar size="26">
          <v-icon
            small
            outline
            :color="categories[item.id].color"
            class="lighten-10"
            dark
          >
            {{ categories[item.id].icon }}
          </v-icon>
        </v-list-item-avatar>
        <v-list-item-content class="py-2 px-0">
          <p class="text-subtitle-2 mb-0">{{ categories[item.id].name }}</p>
          <p class="text-caption mb-0 font-weight-light">{{ item.count === 1 ? '1 transaction' : `${item.count} transactions` }}</p>
        </v-list-item-content>
      </v-list-item>
    </template>

    <template v-slot:item.amount="{ item }">
      <div class="transactions-breakdown__amount">
        <v-chip
          small
          outlined
        >
          <v-icon>
            mdi-currency-{{currency.code.toLowerCase()}}
          </v-icon>
          {{item.total}}
        </v-chip>
        <small class="text-caption mb-0 font-weight-light mt-0 mr-1">{{ percentage(item.total) }}%</small>
      </div>
    </template>
  </v-data-table>
</template>

<script>
const DEFAULT_HEADERS = [
  { text: 'Transaction', value: 'tx', align: 'start', cellClass: 'px-0', sortable: false },
  { text: 'Amount', value: 'amount', align: 'end', cellClass: 'pt-0 pr-1 pl-0 mr-5', sortable: false }
]

export default {
  name: 'TransactionsBreakdown',
  props: {
    items: {
      type: Array,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    },
    categories: {
      type: Object,
      required: true
    },
    currency: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    headers: DEFAULT_HEADERS
  }),
  computed: {
    breakdown () {
      const grouped = this.items.reduce((acc, tx) => {
        const catId = tx.categoryId
        if (!acc[catId]) {
          acc[catId] = { count: 0, total: 0, id: catId }
        }
        acc[catId] = { id: catId, count: acc[catId].count + 1, total: tx.amount.value + acc[catId].total }
        return acc
      }, {})

      return Object.values(grouped).sort((a, b) => b.total - a.total)
    }
  },
  methods: {
    percentage (amount) {
      const percent = amount * 100 / this.totalAmount
      return percent.toFixed(2)
    }
  }
}
</script>

<style lang="scss">
.transactions-breakdown {

  &__amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
