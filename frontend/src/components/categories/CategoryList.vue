<template>
  <v-virtual-scroll
    class="category-list"
    :height="height"
    :items="tableData"
    item-height="46"
    bench="2"
  >
    <template v-slot:default="{ item }">
      <swiper :ref="item.id" :options="swiperOptions(item.id)" :key="item.id">
        <swiper-slide>
          <v-list-item @click="editItem(item)">
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
        </swiper-slide>
        <swiper-slide class="category-list__menu">
          <v-btn
            class="category-list__icon ml-2 mr-2"
            icon
            dark
            color="red"
            x-small
            @click="deleteItem(item.id)"
          >
            <v-icon dark>
              mdi-trash-can-outline
            </v-icon>
          </v-btn>
        </swiper-slide>
      </swiper>
      <v-divider v-if="!item.last" />
    </template>
  </v-virtual-scroll>
</template>

<script>
export default {
  name: 'CategoryList',
  props: {
    items: {
      type: Array,
      required: true
    },
    windowHeight: {
      type: Number,
      required: true
    }
  },
  computed: {
    ids () {
      return this.items.map(i => i.id)
    },
    tableData () {
      return this.items.map((item, i) => ({
        id: item.id,
        color: item.color,
        icon: item.icon,
        name: item.name,
        kind: item.kind,
        original: item,
        last: i === this.items.length - 1
      }))
    },
    height () {
      return this.windowHeight - 137
    }
  },
  methods: {
    swiper (id) {
      return this.$refs[id].$swiper
    },
    editItem (item) {
      this.closeAll(this.ids)
      this.$emit('edit', item.original)
    },
    deleteItem (id) {
      this.closeAll(this.ids)
      this.$emit('delete', id)
    },
    closeAll (ids) {
      ids.forEach(id => this.swiper(id).slidePrev())
    },
    swiperOptions (id) {
      return {
        initialSlide: 0,
        resistance: false,
        speed: 100,
        slidesPerView: 'auto',
        watchSlidesProgress: true,
        on: {
          snapIndexChange: () => {
            if (this.swiper(id) && this.swiper(id).snapIndex === 1) {
              this.closeAll(this.ids.filter(i => i !== id))
            }
          }
        }
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

  &__menu {
    height: 46px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    width: 16%;
    max-width: 100px;
  }
}
</style>
