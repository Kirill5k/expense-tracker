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
      :value="currentRange"
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
          {{ displayedDate }}
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
import { format, startOfWeek, endOfWeek } from 'date-fns'

const DATE_RANGE_OPTIONS = [
  { value: 'daily', text: 'Daily' },
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'yearly', text: 'Yearly' }
]

export default {
  name: 'DatePeriodSelector',
  props: {
    currentDate: {
      type: Date,
      required: true
    },
    currentRange: {
      type: String,
      required: true
    }
  },
  data: () => ({
    dateRangeOptions: DATE_RANGE_OPTIONS
  }),
  computed: {
    displayedDate () {
      if (this.currentRange === 'daily') {
        return format(this.currentDate, 'do MMM')
      } else if (this.currentRange === 'monthly') {
        return format(this.currentDate, 'LLLL')
      } else if (this.currentRange === 'yearly') {
        return format(this.currentDate, 'yyyy')
      } else {
        const start = startOfWeek(this.currentDate)
        const end = endOfWeek(this.currentDate)
        return `${format(start, 'do MMM')} - ${format(end, 'do MMM')}`
      }
    }
  },
  methods: {
    resetDate (newRange) {
      this.$emit('reset', newRange)
    }
  }
}
</script>

<style lang="scss">

</style>
