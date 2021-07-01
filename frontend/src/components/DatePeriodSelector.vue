<template>
  <div class="d-flex mb-1">
    <v-btn
      class="mx-3"
      depressed
      small
      icon
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
    >
      <v-icon>mdi-arrow-right-thick</v-icon>
    </v-btn>
  </div>
</template>

<script>
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'

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
        return format(this.displayDate.start, 'LLLL')
      } else if (this.displayDate.range === 'yearly') {
        return format(this.displayDate.start, 'yyyy')
      } else {
        return `${format(this.displayDate.start, 'do MMM')} - ${format(this.displayDate.end, 'do MMM')}`
      }
    }
  },
  methods: {
    resetDate (newRange) {
      const today = new Date()
      switch (newRange) {
        case 'daily':
          this.$emit('update', { range: newRange, start: today, end: today })
          break
        case 'weekly':
          this.$emit('update', { range: newRange, start: startOfWeek(today), end: endOfWeek(today) })
          break
        case 'monthly':
          this.$emit('update', { range: newRange, start: startOfMonth(today), end: endOfMonth(today) })
          break
        default:
          this.$emit('update', { range: newRange, start: startOfYear(today), end: endOfYear(today) })
      }
    }
  }
}
</script>

<style lang="scss">

</style>
