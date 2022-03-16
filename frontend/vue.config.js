module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:6000',
        ws: true,
        changeOrigin: true
      }
    }
  }
}
