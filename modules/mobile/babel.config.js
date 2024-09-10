module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", {jsxImportSource: "nativewind"}],
      "nativewind/babel"
    ],
    plugins: [
      [
        'module-resolver',
        {
          alias: {
            '@': './', // Adjust the path according to your project structure
          },
        },
      ],
    ],
  };
};
