<template>
  <div>
    <v-card
      :loading="loading"
      class="categories mx-auto"
      elevation="2"
    >
      <v-card-title class="py-1">
        Categories
        <v-spacer></v-spacer>
        <v-btn-toggle
          borderless
          dense
          tile
          v-model="kind"
          mandatory
        >
          <v-btn x-small value="expense">
            Expense
          </v-btn>
          <v-btn x-small value="income">
            Income
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-card-text class="pb-0">
        <v-divider/>
        <category-list
          :items="categories"
          :editable="editable"
          :window-height="windowHeight"
          @delete="removeWithWarning"
          @edit="edit"
        />
        <v-divider v-if="categories.length" />
      </v-card-text>

      <v-card-actions class="py-0">
        <v-btn
          v-if="categories.length"
          class="float-left mx-2 my-1"
          color="primary"
          x-small
          bottom
          left
          fab
          @click="editable = !editable"
        >
          <v-icon dark>{{ editable ? 'mdi-check' : 'mdi-pencil' }}</v-icon>
        </v-btn>
        <v-spacer/>
        <new-category-dialog
          ref="newCategoryDialog"
          @update="update"
          @save="create"
        />
      </v-card-actions>
    </v-card>
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
    <remove-category-dialog
      ref="removeCategoryDialog"
      @delete="remove"
    />
  </div>
</template>

<script>
import CategoryList from '@/components/categories/CategoryList'
import NewCategoryDialog from '@/components/categories/NewCategoryDialog'
import RemoveCategoryDialog from '@/components/categories/RemoveCategoryDialog'
import ActionDispatcher from '@/mixins/dispatcher'

export default {
  name: 'Categories',
  components: {
    CategoryList,
    NewCategoryDialog,
    RemoveCategoryDialog
  },
  mixins: [ActionDispatcher],
  data: () => ({
    lastDeletedId: null,
    editable: false,
    kind: 'expense'
  }),
  computed: {
    categories () {
      return this.kind === 'expense' ? this.expenseCats : this.incomeCats
    },
    expenseCats () {
      return this.$store.getters.expenseCats
    },
    incomeCats () {
      return this.$store.getters.incomeCats
    },
    windowHeight () {
      const height = this.$vuetify.breakpoint.height
      return this.$vuetify.breakpoint.xs ? height : (height - 100)
    }
  },
  methods: {
    create (newCategory) {
      this.dispatchAction('createCategory', newCategory)
    },
    removeWithWarning (id) {
      const numberOfUses = this.getNumberOfUses(id)
      if (numberOfUses > 0) {
        this.$refs.removeCategoryDialog.open(id, numberOfUses)
      } else {
        this.remove(id)
      }
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
    },
    getNumberOfUses (catId) {
      return this.$store.getters.transactionsByCatsCount[catId] || 0
    }
  }
}
</script>

<style lang="scss">
.categories {
  overflow: inherit;
}
</style>
