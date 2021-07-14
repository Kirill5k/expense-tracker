<template>
  <div class="date-period-selector d-flex mb-1" style="width: 100%">
    <v-btn
      class="ml-0 mr-3"
      depressed
      small
      icon
      @click="goBack"
    >
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-overflow-btn
      :value="displayDate.range"
      :items="dateRangeOptions"
      label="Show spending"
      hint="Show spending"
      hide-details
      single-line
      class="pa-0 ma-0 date-period-selector__select"
      @input="resetDate"
      dense
      :height="30"
    >
      <template v-slot:selection="{ }">
        <p class="ma-0 mt-1 text-center text-subtitle-2" style="width: 100%">
          {{ displayDate.text }}
        </p>
      </template>
    </v-overflow-btn>
    <v-btn
      class="ml-3 mr-0"
      depressed
      small
      icon
      @click="goForward"
    >
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addWeeks, addMonths, addYears } from 'date-fns'

const DATE_RANGE_OPTIONS = [
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'yearly', text: 'Yearly' }
]

export default {
  name: 'DatePeriodSelector',
  props: {
    displayDate: {
      type: Object,
      required: true
    }
  },
  created () {
    if (!this.displayDate.text) {
      this.resetDate('monthly')
    }
  },
  data: () => ({
    dateRangeOptions: DATE_RANGE_OPTIONS
  }),
  methods: {
    update (newDisplayDate) {
      this.$emit('update', newDisplayDate)
    },
    resetDate (newRange) {
      const newDate = this.applyNewRange(newRange)
      const previous = this.incrementBy(-1, newDate)
      this.update({ ...newDate, previous })
    },
    goBack () {
      const newDate = this.incrementBy(-1, this.displayDate)
      const previous = this.incrementBy(-1, newDate)
      this.update({ ...newDate, previous })
    },
    goForward () {
      const newDate = this.incrementBy(1, this.displayDate)
      const previous = this.displayDate
      this.update({ ...newDate, previous })
    },
    incrementBy (amount, { start, end, range, index }) {
      switch (range) {
        case 'monthly':
          return this.newDisplayDate(range, addMonths(start, amount), endOfMonth(addMonths(end, amount)), index + amount)
        case 'weekly':
          return this.newDisplayDate(range, addWeeks(start, amount), addWeeks(end, amount), index + amount)
        default:
          return this.newDisplayDate(range, addYears(start, amount), addYears(end, amount), index + amount)
      }
    },
    applyNewRange (newRange) {
      const today = new Date()
      switch (newRange) {
        case 'weekly':
          return this.newDisplayDate(newRange, startOfWeek(today), endOfWeek(today))
        case 'monthly':
          return this.newDisplayDate(newRange, startOfMonth(today), endOfMonth(today))
        default:
          return this.newDisplayDate(newRange, startOfYear(today), endOfYear(today))
      }
    },
    newDisplayDate (range, start, end, index = 0) {
      switch (range) {
        case 'monthly':
          return { index, range, start, end, text: format(start, 'LLLL yyyy') }
        case 'yearly':
          return { index, range, start, end, text: format(start, 'yyyy') }
        default:
          return { index, range, start, end, text: `${format(start, 'do MMM')} - ${format(end, 'do MMM')}` }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.date-period-selector {
  &__select {
    * {
      align-self: flex-start
    }
  }
}
</style>
