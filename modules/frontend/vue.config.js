module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '^/api': {
        target: 'https://expense-tracker-core.onrender.com',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
