<template>
  <page>
    <v-card class="analytics mx-auto">
      <v-card-title>
        Analytics
      </v-card-title>

      <v-card-text>
        <date-period-selector
          :display-date="this.$store.state.displayDate"
          @update="updateDisplayDate"
        />
      </v-card-text>
    </v-card>
  </page>
</template>

<script>
import Page from '@/components/Page'
import DatePeriodSelector from '@/components/DatePeriodSelector'

export default {
  name: 'Analytics',
  components: {
    Page,
    DatePeriodSelector
  },
  methods: {
    updateDisplayDate (newRange) {
      this.$store.commit('setDisplayDate', newRange)
    }
  }
}
</script>

<style lang="scss">
.analytics {

}
</style>
