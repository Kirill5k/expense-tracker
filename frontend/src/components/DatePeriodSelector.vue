<template>
  <div class="d-flex">
    <v-btn depressed>
      Left
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
          {{ currentDate }}
        </p>
      </template>
    </v-overflow-btn>
    <v-btn depressed>
      Right
    </v-btn>
  </div>
</template>

<script>
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
      type: String,
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
  methods: {
    resetDate (newRange) {
      console.log(newRange)
    }
  }
}
</script>

<style lang="scss">

</style>
