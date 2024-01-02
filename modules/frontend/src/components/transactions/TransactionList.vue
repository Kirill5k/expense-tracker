<template>
  <v-virtual-scroll
    v-if="items.length"
    class="transaction-list"
    :max-height="height"
    :items="tableData"
    item-height="78"
    bench="1000"
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
            <v-list-item-content class="py-2 px-1">
              <p class="text-subtitle-2 mb-0" :class="item.tx.note || item.tx.tags.length ? '' : 'mt-2 mb-1'">{{ item.tx.name }}</p>
              <p class="text-caption mb-0 font-weight-medium">
                {{ item.tx.note }}
                <v-chip outlined x-small class="mr-1 px-1 my-0" v-for="tag in item.tx.tags" :key="tag">
                  {{ tag }}
                </v-chip>
              </p>
              <p class="text-caption mb-0 font-weight-light" :class="item.tx.note || item.tx.tags.length ? '' : 'mb-2'">{{ item.tx.displayDate }}</p>
            </v-list-item-content>
            <v-list-item-action>
              <v-chip
                small
                outlined
                :color="item.amount.kind === 'expense' ? 'error' : 'success'"
              >
                {{ item.amount.kind === 'expense' ? '-' : '+' }}
                <v-icon size="12">
                  mdi-currency-{{item.amount.currency.toLowerCase()}}
                </v-icon>
                {{item.amount.value}}
              </v-chip>
            </v-list-item-action>
          </v-list-item>
        </swiper-slide>
        <swiper-slide class="transaction-list__menu">
          <v-btn
            class="transaction-list__icon ml-2 mr-2"
            icon
            dark
            color="primary"
            x-small
            @click="copyItem(item)"
          >
            <v-icon dark>
              mdi-content-copy
            </v-icon>
          </v-btn>
          <v-btn
            class="transaction-list__icon ml-2 mr-2"
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
  <p class="py-4 px-2 text-center text-subtitle-2" v-else>
    No transactions for this period
  </p>
</template>

<script>
export default {
  name: 'TransactionList',
  props: {
    items: {
      type: Array,
      required: true
    },
    editable: {
      type: Boolean,
      default: false
    },
    categories: {
      type: Object,
      required: true
    },
    sortBy: {
      type: Object,
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
        color: this.categories[item.categoryId].color,
        icon: this.categories[item.categoryId].icon,
        tx: { name: this.categories[item.categoryId].name, note: item.note, displayDate: this.formatTxDate(item), date: item.date, tags: item.tags },
        amount: { value: item.amount.value, kind: item.kind, currency: item.amount.currency.code },
        original: item,
        last: i === this.items.length - 1
      }))
    },
    height () {
      const extra = this.items.length === 0 ? 40 : 0
      return this.windowHeight - 171 + extra
    }
  },
  methods: {
    formatTxDate (tx) {
      const date = new Date(tx.date)
      return date.toLocaleString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    },
    swiper (id) {
      return this.$refs[id].$swiper
    },
    editItem (item) {
      this.$emit('edit', item.original)
    },
    deleteItem (id) {
      this.closeAll(this.ids)
      this.$emit('delete', id)
    },
    copyItem (item) {
      this.$emit('copy', item.original)
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
.transaction-list {
  &__icon {
    width: 20px;
  }

  &__menu {
    height: 78px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    width: 24%;
    max-width: 100px;
  }
}
</style>
