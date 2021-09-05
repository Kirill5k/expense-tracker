<template>
  <v-data-table
    class="categories-breakdown"
    :headers="headers"
    :items="categoryBreakdown"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    :headers-length="2"
    no-data-text="No transactions for this period"
    :height="height"
    disable-pagination
    mobile-breakpoint="100"
  >
    <template v-slot:[`item.tx`]="{ item }">
      <v-list-item>
        <v-list-item-avatar
          :color="item.color"
          size="26"
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
        <v-list-item-content class="py-2 px-0">
          <p class="text-subtitle-2 mb-0">{{ item.name }}</p>
          <p class="text-caption mb-0 font-weight-light">{{ item.count === 1 ? '1 transaction' : `${item.count} transactions` }}</p>
        </v-list-item-content>
      </v-list-item>
    </template>

    <template v-slot:[`item.amount`]="{ item }">
      <div class="categories-breakdown__amount">
        <v-chip
          small
          outlined
        >
          <v-icon>
            mdi-currency-{{currency.code.toLowerCase()}}
          </v-icon>
          {{item.total.toFixed(2)}}
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
  name: 'CategoriesBreakdown',
  props: {
    totalAmount: {
      type: [String, Number],
      required: true
    },
    categoryBreakdown: {
      type: Array,
      required: true
    },
    currency: {
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
    height () {
      if (this.windowHeight < 600) {
        return 214
      } else if (this.windowHeight < 700) {
        return this.windowHeight - 434
      } else {
        return this.windowHeight - 474
      }
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

<style lang="scss" scoped>
.categories-breakdown {
  &__amount {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
}
</style>
