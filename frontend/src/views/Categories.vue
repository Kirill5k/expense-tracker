<template>
  <v-card
    :loading="loading"
    class="categories mx-auto"
    elevation="8"
  >
    <v-card-title>
      Categories
    </v-card-title>

    <v-card-text class="pb-0">
      <category-list
        :items="[...expenseCats, ...incomeCats]"
        :editable="editable"
        @delete="remove"
        @edit="edit"
      />
    </v-card-text>

    <v-card-actions>
      <v-btn
        v-if="categories.length"
        color="primary"
        x-small
        absolute
        bottom
        left
        fab
        @click="editable = !editable"
      >
        <v-icon dark>{{ editable ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
      </v-btn>

      <v-spacer></v-spacer>
      <new-category-dialog
        ref="newCategoryDialog"
        @update="update"
        @save="create"
      />
    </v-card-actions>

    <v-snackbar
      v-model="undoOp"
    >
      The category has been deleted
      <template v-slot:action="{ attrs }">
        <v-btn
          color="primary"
          text
          v-bind="attrs"
          @click="undoRemove"
        >
          Undo
        </v-btn>
        <v-btn
          color="success"
          text
          v-bind="attrs"
          @click="undoOp = null"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script>
import CategoryList from '@/components/categories/CategoryList'
import NewCategoryDialog from '@/components/categories/NewCategoryDialog'

export default {
  name: 'Categories',
  components: {
    CategoryList,
    NewCategoryDialog
  },
  data: () => ({
    lastDeletedId: null,
    undoOp: false,
    loading: false,
    editable: false
  }),
  computed: {
    categories () {
      return this.$store.state.categories
    },
    expenseCats () {
      return this.$store.getters.expenseCats
    },
    incomeCats () {
      return this.$store.getters.incomeCats
    }
  },
  methods: {
    dispatchAction (name, arg) {
      this.undoOp = false
      this.loading = true
      return this.$store
        .dispatch(name, arg)
        .then(() => {
          this.loading = false
        })
    },
    create (newCategory) {
      this.dispatchAction('createCategory', newCategory)
    },
    remove (id) {
      this.dispatchAction('hideCategory', { id, hidden: true })
        .then(() => {
          this.lastDeletedId = id
          this.undoOp = true
        })
    },
    undoRemove () {
      if (this.lastDeletedId) {
        this.dispatchAction('hideCategory', { id: this.lastDeletedId, hidden: false })
        this.lastDeletedId = null
      }
    },
    update (updatedCategory) {
      this.dispatchAction('updateCategory', updatedCategory)
    },
    edit (category) {
      this.$refs.newCategoryDialog.update(category)
    }
  }
}
</script>

<style lang="scss">
.categories {

}
</style>
