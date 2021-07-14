<template>
  <p
    v-if="!transactions.length"
    class="category-analysis text-center pt-5"
  >
    No {{ kind }} transactions for this period
  </p>
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
    <p class="text-subtitle-2 ml-2 mb-0 mt-1 text-capitalize">{{ kind }} breakdown</p>
    <categories-breakdown
      :window-height="windowHeight"
      :currency="currency"
      :category-breakdown="breakdown"
      :total-amount="totalAmount"
    />
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
    categories: {
      type: Object,
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
        const catId = tx.categoryId
        if (!acc[catId]) {
          acc[catId] = { count: 0, total: 0, ...this.categories[catId] }
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
