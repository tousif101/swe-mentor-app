module.exports = function (api) {
  api.cache(false); // Disabled caching to debug env var issue
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
  };
};
