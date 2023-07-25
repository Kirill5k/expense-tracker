module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '^/api': {
        target: 'https://web-expense-tracker-kirill5k.cloud.okteto.net',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
