<template>
  <v-virtual-scroll
    :height="height"
    :items="tableData"
    item-height="46"
    bench="2"
  >
    <template v-slot:default="{ item }">
      <v-list-item :key="item.id">
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
        <v-list-item-content class="py-3 px-1">
          <p class="text-subtitle-2 mb-0">{{ item.name }}</p>
        </v-list-item-content>
        <v-list-item-action>
          <v-list-item-subtitle v-text="item.kind" class="text-right font-weight-light text-capitalize"/>
        </v-list-item-action>
      </v-list-item>
    </template>
  </v-virtual-scroll>
</template>

<script>
export default {
  name: 'NewCategoryList',
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
      return this.windowHeight - 137
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
