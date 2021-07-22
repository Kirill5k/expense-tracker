<template>
  <div
    class="home flex-column-reverse flex-sm-row py-0 py-sm-12"
  >
    <div
      class="home__column text-center text-sm-right"
    >
      <p class="text-h2">Expense-tracker</p>
      <p class="text-subtitle">Keep your finances under control!</p>
      <v-btn rounded outlined @click="register">
        get started
      </v-btn>
    </div>
    <div
      class="home__column"
      :style="{width: $vuetify.breakpoint.xsOnly ? '100%' : '50%'}"
    >
      <demo-chart
        :window-height="$vuetify.breakpoint.height"
        :dark="$vuetify.theme.dark"
      />
    </div>
  </div>
</template>

<script>
import DemoChart from '@/components/home/DemoChart'

export default {
  name: 'Home',
  components: { DemoChart },
  methods: {
    register () {
      this.$router.push('/register')
    }
  }
}
</script>

<style lang="scss">
.home {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &__column {
    height: 100%;
  }
}
</style>
