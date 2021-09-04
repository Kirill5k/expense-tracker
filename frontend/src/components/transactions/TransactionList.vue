<template>
  <v-data-table
    class="transaction-list"
    :sort-by.sync="sortBy.field"
    :sort-desc.sync="sortBy.desc"
    :headers="headers"
    :items="tableData"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    no-data-text="No transactions for this period"
    :height="height"
    :headers-length="2"
    disable-pagination
    mobile-breakpoint="100"
    @click:row="rowClick"
  >
    <template v-slot:[`item.icon`]="{ item }">
      <v-list-item-avatar
        size="26"
        :color="item.color"
      >
        <v-icon
          small
          outline
          class="lighten-10"
          dark
        >
          {{ item.icon }}
        </v-icon>
      </v-list-item-avatar>
    </template>

    <template v-slot:[`item.tx`]="{ item }">
      <v-list-item-content class="py-2 px-1">
        <p class="text-subtitle-2 mb-0">{{ item.tx.name }}</p>
        <p class="text-caption mb-0 font-weight-medium">{{ item.tx.note }} </p>
        <p class="text-caption mb-0 font-weight-light">{{ item.tx.displayDate }}</p>
      </v-list-item-content>
    </template>

    <template v-slot:[`item.amount`]="{ item }">
      <v-chip
        small
        outlined
        :color="item.amount.kind === 'expense' ? 'error' : 'success'"
      >
        {{ item.amount.kind === 'expense' ? '-' : '+' }}
        <v-icon>
          mdi-currency-{{item.amount.currency.toLowerCase()}}
        </v-icon>
        {{item.amount.value}}
      </v-chip>
    </template>

    <template v-slot:[`item.delete`]="{ item }">
      <v-slide-x-transition>
        <v-btn
          v-if="editable"
          icon
          dark
          color="red"
          x-small
          @click="$emit('delete', item.id)"
        >
          <v-icon dark>
            mdi-trash-can-outline
          </v-icon>
        </v-btn>
      </v-slide-x-transition>
    </template>

    <template v-slot:[`item.edit`]="{ item }">
      <v-slide-x-reverse-transition>
        <v-btn
          v-if="editable"
          icon
          dark
          color="secondary"
          x-small
          @click="$emit('edit', item.original)"
        >
          <v-icon dark>
            mdi-chevron-right
          </v-icon>
        </v-btn>
      </v-slide-x-reverse-transition>
    </template>
  </v-data-table>
</template>

<script>
const DEFAULT_HEADERS = [
  { text: '', value: 'delete', align: 'start', cellClass: 'pa-0 px-1', sortable: false },
  { text: 'Icon', value: 'icon', align: 'start', cellClass: 'pt-0 pr-0 pl-1', sortable: false },
  { text: 'Transaction', value: 'tx', align: 'start', cellClass: 'px-0', sort: (a, b) => a.date.localeCompare(b.date) },
  { text: 'Amount', value: 'amount', align: 'end', cellClass: 'pt-0 pr-1 pl-0', sort: (a, b) => b.value - a.value },
  { text: '', value: 'edit', align: 'end', cellClass: 'pa-0 px-1', sortable: false }
]

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
    },
    sortBy: {
      type: Object,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    headers: DEFAULT_HEADERS
  }),
  computed: {
    tableData () {
      return this.items.map(i => ({
        id: i.id,
        color: this.categories[i.categoryId].color,
        icon: this.categories[i.categoryId].icon,
        tx: { name: this.categories[i.categoryId].name, note: i.note, displayDate: this.formatTxDate(i), date: i.date },
        amount: { value: i.amount.value, kind: i.kind, currency: i.amount.currency.code },
        original: i
      }))
    },
    height () {
      const extra = this.items.length === 0 ? 40 : 0
      return this.windowHeight - 171 + extra
    }
  },
  methods: {
    formatTxDate (tx) {
      const date = new Date(tx.date)
      return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },
    rowClick (clickedItem, rowData) {
      if (!this.editable) {
        this.$emit('edit', rowData.item.original)
      }
    }
  }
}
</script>

<style lang="scss">
.transaction-list {

}
</style>
