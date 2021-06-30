<template>
  <v-data-table
    class="transaction-list"
    :headers="headers"
    :items="tableData"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    no-data-text="No transactions for this period"
    height="300"
    :headers-length="2"
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
        <p class="text-subtitle-2 mb-0">{{ item.tx.name }}</p>
        <p class="text-caption mb-0 font-weight-medium">{{ item.tx.note }} </p>
        <p class="text-caption mb-0 font-weight-light">{{ item.tx.date }}</p>
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

    <template v-slot:item.edit="{ item }">
      <div
        v-if="editable"
        class="d-flex transaction-list__slider"
        :class="editable ? 'transaction-list__slider--slide-in' : 'transaction-list__slider--slide-out'"
      >
        <v-btn
          icon
          dark
          color="blue"
          x-small
          @click="$emit('edit', item)"
          class="mr-2"
        >
          <v-icon dark>
            mdi-pencil
          </v-icon>
        </v-btn>
        <v-btn
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
      </div>
    </template>
  </v-data-table>
</template>

<script>
const DEFAULT_HEADERS = [
  { text: 'Icon', value: 'icon', align: 'start', cellClass: 'pt-0 pr-0 pl-1', sortable: false },
  { text: 'Transaction', value: 'tx', align: 'start', cellClass: 'px-0' },
  { text: 'Amount', value: 'amount', align: 'end', cellClass: 'pt-0 pr-1 pl-0' }
]

const EDIT_HEADER = { text: '', value: 'edit', align: 'start', cellClass: 'pa-0 pr-1 pb-1' }

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
  computed: {
    tableData () {
      return this.items.map(i => ({
        id: i.id,
        icon: this.categories[i.categoryId].icon,
        tx: { name: this.categories[i.categoryId].name, note: i.note, date: this.formatTxDate(i) },
        amount: { value: this.formatTxAmount(i), kind: i.kind }
      }))
    },
    headers () {
      return this.editable ? [...DEFAULT_HEADERS, EDIT_HEADER] : DEFAULT_HEADERS
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

<style lang="scss">
.transaction-list {

  &__slider {
    transform: translateX(100%);
    -webkit-transform: translateX(100%);

    &--slide-in {
      animation: slide-in 0.5s forwards;
      -webkit-animation: slide-in 0.5s forwards;
    }

    &--slide-out {
      animation: slide-out 0.5s forwards;
      -webkit-animation: slide-out 0.5s forwards;
    }

    @keyframes slide-in {
      100% { transform: translateX(0%); }
    }

    @-webkit-keyframes slide-in {
      100% { -webkit-transform: translateX(0%); }
    }

    @keyframes slide-out {
      0% { transform: translateX(0%); }
      100% { transform: translateX(-100%); }
    }

    @-webkit-keyframes slide-out {
      0% { -webkit-transform: translateX(0%); }
      100% { -webkit-transform: translateX(-100%); }
    }
  }
}
</style>
