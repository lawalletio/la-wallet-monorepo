module.exports = {
  plugins: [
    // {
    //   name: 'template',
    //   path: '@lawallet/plugin-template',
    //   metadataPath: '@lawallet/plugin-template/metadata',
    //   routesPath: '@lawallet/plugin-template',
    // },
    {
      name: 'pos',
      path: '@lawallet/pos',
      metadataPath: '@lawallet/pos/metadata',
      routesPath: '@lawallet/pos',
    },
  ],
};
