<template>
  <v-list dense>
    <v-subheader>{{name}}</v-subheader>
    <v-list-item
      dense
      v-if="!items.length"
    >
      <v-list-item-subtitle
        class="text-center"
      >
        No categories in this group
      </v-list-item-subtitle>
    </v-list-item>
    <v-list-item-group
      v-model="selectedItem"
      color="primary"
    >
      <v-list-item
        v-for="item in items"
        :key="item.id"
      >
        <v-list-item-icon>
          <v-icon v-text="item.icon"/>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title v-text="item.name"/>
        </v-list-item-content>
      </v-list-item>
    </v-list-item-group>
  </v-list>
</template>

<script>
export default {
  name: 'CategoryList',
  props: {
    name: {
      type: String,
      required: true
    },
    items: {
      type: Array,
      required: true
    }
  },
  data: () => ({
    selectedItem: null
  })
}
</script>
