<template>
  <v-card-subtitle
    v-if="!transactions.length"
    class="category-analysis text-center pt-5"
  >
    No {{ kind }} transactions for this period
  </v-card-subtitle>
  <div
    v-else
    class="category-analysis"
  >
    <categories-chart
      :window-height="windowHeight"
      :category-breakdown="breakdown"
      :currency="currency"
      :dark="dark"
    />
    <v-card-text class="py-0 px-0 px-sm-4">
      <p class="text-subtitle-2 ml-2 mb-0 mt-1 text-capitalize">{{ kind }} breakdown</p>
      <v-divider></v-divider>
      <categories-breakdown
        :window-height="windowHeight"
        :currency="currency"
        :category-breakdown="breakdown"
        :total-amount="totalAmount"
      />
      <v-divider></v-divider>
    </v-card-text>
  </div>
</template>

<script>
import CategoriesChart from '@/components/analytics/CategoriesChart'
import CategoriesBreakdown from '@/components/analytics/CategoriesBreakdown'

export default {
  name: 'CategoryAnalysis',
  components: {
    CategoriesChart,
    CategoriesBreakdown
  },
  props: {
    kind: {
      type: String,
      required: true
    },
    transactions: {
      type: Array,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    },
    currency: {
      type: Object,
      required: true
    },
    totalAmount: {
      type: String,
      required: true
    },
    dark: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    breakdown () {
      const grouped = this.transactions.reduce((acc, tx) => {
        const catId = tx.category.id
        if (!acc[catId]) {
          acc[catId] = { count: 0, total: 0, ...tx.category }
        }
        acc[catId] = { ...acc[catId], count: acc[catId].count + 1, total: tx.amount.value + acc[catId].total }
        return acc
      }, {})

      return Object.values(grouped).sort((a, b) => b.total - a.total)
    }
  }
}
</script>

<style lang="scss">
.category-analysis {

}
</style>
