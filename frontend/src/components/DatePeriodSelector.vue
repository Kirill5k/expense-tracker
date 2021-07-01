<template>
  <div class="d-flex mb-1">
    <v-btn
      class="mx-3"
      depressed
      small
      icon
      @click="goBack"
    >
      <v-icon>mdi-arrow-left-thick</v-icon>
    </v-btn>
    <v-overflow-btn
      :value="displayDate.range"
      :items="dateRangeOptions"
      label="Show spending"
      hint="Show spending"
      hide-details
      single-line
      class="pa-0 ma-0"
      @input="resetDate"
      dense
      :height="30"
    >
      <template v-slot:selection="{ }">
        <p class="ma-0 text-center text-subtitle-2" style="width: 100%">
          {{ formattedDisplayedDate }}
        </p>
      </template>
    </v-overflow-btn>
    <v-btn
      class="mx-3"
      depressed
      small
      icon
      @click="goForward"
    >
      <v-icon>mdi-arrow-right-thick</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay, addDays, addWeeks, addMonths, addYears } from 'date-fns'

const DATE_RANGE_OPTIONS = [
  { value: 'daily', text: 'Daily' },
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
  computed: {
    formattedDisplayedDate () {
      if (this.displayDate.range === 'daily') {
        return format(this.displayDate.start, 'do MMM')
      } else if (this.displayDate.range === 'monthly') {
        return format(this.displayDate.start, 'LLLL yyyy')
      } else if (this.displayDate.range === 'yearly') {
        return format(this.displayDate.start, 'yyyy')
      } else {
        return `${format(this.displayDate.start, 'do MMM')} - ${format(this.displayDate.end, 'do MMM')}`
      }
    }
  },
  methods: {
    update (newDisplayDate) {
      this.$emit('update', newDisplayDate)
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
        case 'daily':
          return { range, start: addDays(start, amount), end: addDays(end, amount) }
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
        case 'daily':
          return { range: newRange, start: startOfDay(today), end: endOfDay(today) }
        case 'weekly':
          return { range: newRange, start: startOfWeek(today), end: endOfWeek(today) }
        case 'monthly':
          return { range: newRange, start: startOfMonth(today), end: endOfMonth(today) }
        default:
          return { range: newRange, start: startOfYear(today), end: endOfYear(today) }
      }
    }
  }
}
</script>

<style lang="scss">

</style>
