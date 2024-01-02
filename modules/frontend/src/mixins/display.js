const DisplayAdjuster = {
  computed: {
    windowHeight () {
      const height = this.$vuetify.breakpoint.height
      return this.$vuetify.breakpoint.xs ? height : (height - 100)
    }
  }
}

export default DisplayAdjuster
