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
    <template v-slot:item.icon="{ item }">
      <v-list-item-avatar
        size="26"
      >
        <v-icon
          small
          outline
          class="black lighten-10"
          dark
        >
          {{ categories[item.id].icon }}
        </v-icon>
      </v-list-item-avatar>
    </template>

    <template v-slot:item.tx="{ item }">
      <v-list-item-content class="py-2 px-0">
        <p class="text-subtitle-2 mb-0">{{ categories[item.id].name }}</p>
        <p class="text-caption mb-0 font-weight-light">{{ item.count }} Transactions</p>
      </v-list-item-content>
    </template>

    <template v-slot:item.amount="{ item }">
      <div class="transactions-breakdown__amount">
        <v-chip
          small
          outlined
        >
          <v-icon>
            mdi-currency-{{currencyName.toLowerCase()}}
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
  { text: 'Icon', value: 'icon', align: 'start', cellClass: 'pt-0 pr-0 pl-3', sortable: false, width: '10%' },
  { text: 'Transaction', value: 'tx', align: 'start', cellClass: 'px-0', sortable: false, width: '80%' },
  { text: 'Amount', value: 'amount', align: 'end', cellClass: 'pt-0 pr-1 pl-0', sortable: false, width: '10%' }
]

export default {
  name: 'TransactionsBreakdown',
  props: {
    items: {
      type: Array,
      required: true
    },
    categories: {
      type: Object,
      required: true
    },
    currencyName: {
      type: String,
      required: true
    }
  },
  data: () => ({
    headers: DEFAULT_HEADERS
  }),
  computed: {
    totalAmount () {
      return this.items.map(t => t.amount.value).reduce((acc, i) => acc + i, 0)
    },
    tableData () {
      return this.items.map(i => ({
        id: i.id,
        icon: this.categories[i.categoryId].icon,
        tx: { name: this.categories[i.categoryId].name, note: i.note, date: this.formatTxDate(i) },
        amount: { value: i.amount.value, kind: i.kind, currency: i.amount.currency },
        original: i
      }))
    },
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
.test {
  max-width: 100px;
}
.transactions-breakdown {

  &__amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
