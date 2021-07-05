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
  data: () => ({
    dateRangeOptions: DATE_RANGE_OPTIONS
  }),
  methods: {
    update (newDisplayDate) {
      this.$emit('update', { ...newDisplayDate, text: this.getDisplayedDateText(newDisplayDate) })
    },
    resetDate (newRange) {
      this.update(this.applyNewRange(newRange))
    },
    goBack () {
      this.update(this.incrementBy(-1))
    },
    goForward () {
      this.update(this.incrementBy(1))
    },
    incrementBy (amount) {
      const start = this.displayDate.start
      const end = this.displayDate.end
      const range = this.displayDate.range
      switch (this.displayDate.range) {
        case 'monthly':
          return { range, start: addMonths(start, amount), end: endOfMonth(addMonths(end, amount)) }
        case 'weekly':
          return { range, start: addWeeks(start, amount), end: addWeeks(end, amount) }
        default:
          return { range, start: addYears(start, amount), end: addYears(end, amount) }
      }
    },
    applyNewRange (newRange) {
      const today = new Date()
      switch (newRange) {
        case 'weekly':
          return { range: newRange, start: startOfWeek(today), end: endOfWeek(today) }
        case 'monthly':
          return { range: newRange, start: startOfMonth(today), end: endOfMonth(today) }
        default:
          return { range: newRange, start: startOfYear(today), end: endOfYear(today) }
      }
    },
    getDisplayedDateText (newDisplayDate) {
      if (newDisplayDate.range === 'monthly') {
        return format(newDisplayDate.start, 'LLLL yyyy')
      } else if (newDisplayDate.range === 'yearly') {
        return format(newDisplayDate.start, 'yyyy')
      } else {
        return `${format(newDisplayDate.start, 'do MMM')} - ${format(newDisplayDate.end, 'do MMM')}`
      }
    }
  }
}
</script>

<style lang="scss">
.date-period-selector {
  &__select {
    * {
      align-self: flex-start
    }
  }
}
</style>
