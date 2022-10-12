const path = require("path");
const pkg = require("./package.json");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


module.exports = {
	mode: "production",
	entry: path.resolve(__dirname, "src", "index.js"),
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: "index.js", //<-filename for bundled file
		library: pkg.name,
		libraryTarget: "commonjs",
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				include: path.resolve(__dirname, "src"),
				exclude: /node_modules/,
				use: [
					{
						loader: "babel-loader",
						options: {
							presets: [
								[
									"@babel/preset-env",
									{
										targets: "defaults",
									},
								],
								"@babel/preset-react",
							],
						},
					},
				],
			},
			{
				test: /\.css$/i,
				//include: path.resolve(__dirname, "src"),
				use: [
					"style-loader", // creates style nodes from JS strings
					"css-loader",
				],
			},
			{
				test: /\.(png|jpe?g|gif|svg|wav|mp3)$/i,
				use: [
					{
						loader: "file-loader",
						options: {
							name: "[name].[ext]",
							outputPath: "resources/",
							esModule: false,
						},
					},
				],
			},
		],
	},
	plugins: [
		new MiniCssExtractPlugin({
			filename: "[name].bundle.css",
			chunkFilename: "[id].css",
		}),
	],
};
