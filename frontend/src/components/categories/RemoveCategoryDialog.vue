<template>
  <v-row justify="center">
    <v-dialog
      transition="dialog-top-transition"
      v-model="dialog"
      max-width="400px"
      @click:outside="close"
    >
      <v-card>
        <v-card-title>
          Warning
        </v-card-title>
        <v-card-text>
          <div class="text--primary">
            There {{numberOfUses === 1 ? 'is' : 'are'}} {{numberOfUses}} transaction{{numberOfUses === 1 ? '' : 's'}} submitted under this category.
            Deleting it, will cause {{numberOfUses === 1 ? 'this transaction' : 'these transactions'}} to get deleted as well.
          </div>
          <div class="pt-2 text--primary">
            This is a permanent action. Do you want to continue?
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="blue darken-1"
            text
            @click="remove"
          >
            DELETE CATEGORY
          </v-btn>
          <v-btn
            color="blue darken-1"
            text
            @click="close"
          >
            CANCEL
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script>
export default {
  name: 'RemoveCategoryDialog',
  data: () => ({
    dialog: false,
    numberOfUses: 0,
    catId: null
  }),
  methods: {
    close () {
      this.catId = null
      this.numberOfUses = 0
      this.dialog = false
    },
    open (catId, numberOfUses) {
      this.catId = catId
      this.numberOfUses = numberOfUses
      this.dialog = true
    },
    remove () {
      this.$emit('delete', this.catId)
      this.close()
    }
  }
}
</script>
