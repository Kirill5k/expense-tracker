<template>
  <v-row no-gutters>
    <v-col cols="8">
      <p class="text-h2">Hello, World!</p>
    </v-col>
    <v-col cols="4">
      <demo-chart
        :window-height="$vuetify.breakpoint.height"
        :dark="$vuetify.theme.dark"
      />
    </v-col>
  </v-row>
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
.login {

}
</style>
