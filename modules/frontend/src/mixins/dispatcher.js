const ActionDispatcher = {
  data: () => ({
    undoOp: false,
    loading: false
  }),
  methods: {
    dispatchAction (name, arg) {
      this.undoOp = false
      this.loading = true
      return this.$store
        .dispatch(name, arg)
        .catch(e => {
          this.loading = false
          return Promise.reject(e)
        })
        .then(() => {
          this.loading = false
        })
    }
  }
}

export default ActionDispatcher
