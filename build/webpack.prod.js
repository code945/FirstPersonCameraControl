const baseConfig = require("./webpack.config");

module.exports = {
    ...baseConfig,
    mode: "production",
    node: {
        fs: "empty",
    },
};
