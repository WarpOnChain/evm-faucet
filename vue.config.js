const { beforeMiddleware } = require('./src/server/configure');

module.exports = {
  transpileDependencies: ["vuetify"],
  devServer: {
    before: beforeMiddleware,
    host: "0.0.0.0",   // 👈 allow LAN access
    port: 8080,        // 👈 set port explicitly
    https: false       // 👈 keep HTTP for easy LAN testing
  }
};
