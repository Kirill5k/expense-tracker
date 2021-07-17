<template>
  <v-data-table
    class="category-list"
    :headers="headers"
    :items="tableData"
    hide-default-header
    hide-default-footer
    dense
    :items-per-page="-1"
    no-data-text="No categories"
    :height="height"
    :headers-length="2"
    disable-pagination
    mobile-breakpoint="100"
    @click:row="rowClick"
  >
    <template v-slot:[`item.icon`]="{ item }">
      <v-list-item-avatar
        size="26"
        :color="item.color"
      >
        <v-icon
          small
          outline
          class="lighten-10"
          dark
        >
          {{ item.icon }}
        </v-icon>
      </v-list-item-avatar>
    </template>

    <template v-slot:[`item.name`]="{ item }">
      <v-list-item-content class="py-2 px-1">
        <p class="text-subtitle-2 mb-0">{{ item.name }}</p>
      </v-list-item-content>
    </template>

    <template v-slot:[`item.kind`]="{ item }">
      <v-list-item-content>
        <v-list-item-subtitle v-text="item.kind" class="text-right font-weight-light text-capitalize"/>
      </v-list-item-content>
    </template>

    <template v-slot:[`item.delete`]="{ item }">
      <v-slide-x-transition>
        <v-btn
          class="category-list__icon ml-2 mr-2"
          v-if="editable"
          icon
          dark
          color="red"
          x-small
          @click="$emit('delete', item.id)"
        >
          <v-icon dark>
            mdi-trash-can-outline
          </v-icon>
        </v-btn>
      </v-slide-x-transition>
    </template>

    <template v-slot:[`item.edit`]="{ item }">
      <v-slide-x-reverse-transition>
        <v-btn
          v-if="editable"
          icon
          dark
          color="secondary"
          x-small
          @click="$emit('edit', item.original)"
        >
          <v-icon dark>
            mdi-chevron-right
          </v-icon>
        </v-btn>
      </v-slide-x-reverse-transition>
    </template>
  </v-data-table>
</template>

<script>
const DEFAULT_HEADERS = [
  { text: '', value: 'delete', align: 'start', cellClass: 'pa-0 pl-1 category-list__small-icon', sortable: false },
  { text: 'Icon', value: 'icon', align: 'start', cellClass: 'pt-0 pr-0 pl-2 category-list__icon', sortable: false },
  { text: 'Category', value: 'name', align: 'start', cellClass: 'px-0', sortable: false },
  { text: 'Kind', value: 'kind', align: 'end', cellClass: 'pt-0 pr-1 pl-0', sortable: false },
  { text: '', value: 'edit', align: 'end', cellClass: 'pa-0 px-1', sortable: false }
]

export default {
  name: 'CategoryList',
  props: {
    items: {
      type: Array,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    windowHeight: {
      type: Number,
      required: true
    }
  },
  data: () => ({
    headers: DEFAULT_HEADERS
  }),
  computed: {
    tableData () {
      return this.items.map(i => ({
        id: i.id,
        color: i.color,
        icon: i.icon,
        name: i.name,
        kind: i.kind,
        original: i
      }))
    },
    height () {
      const h = this.windowHeight - 150
      return h > 605 ? 605 : h
    }
  },
  methods: {
    rowClick (clickedItem, rowData) {
      if (!this.editable) {
        this.$emit('edit', rowData.item.original)
      }
    }
  }
}
</script>

<style lang="scss">
.category-list {
  &__icon {
    width: 20px;
  }

  &__small-icon {
    width: 10px;
  }
}
</style>
