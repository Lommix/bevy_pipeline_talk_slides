const path = require("path");
module.exports = (env, argv) => {
    return {
        entry: "./src/main.js",
        output: {
            filename: "main.js",
            path: path.resolve(__dirname, "dist"),
        },
        module: {
            rules: [
                {
                    test: /\.html$/i,
                    loader: "html-loader",
                },
                {
                    test: /\.css$/i,
                    use: ["css-loader"],
                },
            ],
        },
        devServer: {
            static: {
                directory: path.join(__dirname, "dist"),
            },
            port: 9000,
        },
    };
};
