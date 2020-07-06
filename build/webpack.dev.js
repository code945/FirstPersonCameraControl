const baseConfig = require("./webpack.config");

module.exports = {
    ...baseConfig,
    mode: "development",
    devtool: "inline-source-map",
    devServer: {
        contentBase: "../dist", //网站的根目录为 根目录/dist，如果配置不对，会报Cannot GET /错误
        port: 9000, //端口改为9000
        open: true, // 自动打开浏览器，适合懒人
        hot: true,
    },
};
