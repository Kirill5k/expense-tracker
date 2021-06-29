<template>
  <v-data-table
    :headers="headers"
    :items="tableData"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    no-data-text="No transactions for this period"
    height="300"
    :headers-length="4"
    disable-pagination
    mobile-breakpoint="100"
  >
    <template v-slot:item.icon="{ item }">
      <v-list-item-avatar
        size="28"
      >
        <v-icon
          outline
          class="black lighten-10"
          dark
        >
          {{ item.icon }}
        </v-icon>
      </v-list-item-avatar>
    </template>

    <template v-slot:item.tx="{ item }">
      <v-list-item-content class="py-2">
        <v-list-item-title v-text="item.tx.name" class="text-subtitle-2 mb-0" />
        <v-list-item-subtitle class="text-caption mb-0 font-weight-medium" v-text="item.tx.note"/>
        <v-list-item-subtitle v-text="item.tx.date" class="text-caption mb-0 font-weight-light"/>
      </v-list-item-content>
    </template>

    <template v-slot:item.amount="{ item }">
      <v-chip
        small
        outlined
        :color="item.amount.kind === 'expense' ? 'pink' : 'success'"
      >
        {{ item.amount.value }}
      </v-chip>
    </template>
  </v-data-table>
</template>

<script>

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
    selectedItem: null,
    headers: [
      { text: 'Icon', value: 'icon', align: 'start', cellClass: 'pr-0 pl-4', sortable: false },
      { text: 'Transaction', value: 'tx', align: 'start', cellClass: 'px-0' },
      { text: 'Amount', value: 'amount', align: 'end', cellClass: 'pr-4' }
    ]
  }),
  computed: {
    tableData () {
      return this.items.map(i => ({
        icon: this.categories[i.categoryId].icon,
        tx: { name: this.categories[i.categoryId].name, note: i.note, date: this.formatTxDate(i) },
        amount: { value: this.formatTxAmount(i), kind: i.kind }
      }))
    }
  },
  methods: {
    formatTxAmount (tx) {
      const sign = tx.kind === 'expense' ? '-' : '+'
      return `${sign} ${tx.amount.symbol}${tx.amount.value}`
    },
    formatTxDate (tx) {
      const date = new Date(tx.date)
      return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },
    editTx (tx) {
      console.log('edit', tx.id)
    },
    deleteTx (tx) {
      console.log('delete', tx.id)
    }
  }
}
</script>
