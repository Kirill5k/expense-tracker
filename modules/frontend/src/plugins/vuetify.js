import Vue from 'vue'
import Vuetify from 'vuetify/lib/framework'

import colors from 'vuetify/lib/util/colors'

Vue.use(Vuetify)

export default new Vuetify({
  theme: {
    dark: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
    themes: {
      dark: {
        primary: colors.blue.lighten1
      }
    }
  }
})
