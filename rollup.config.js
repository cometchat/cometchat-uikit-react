import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import dts from "rollup-plugin-dts";
import { terser } from "rollup-plugin-terser";
import copy from 'rollup-plugin-copy';
import url from '@rollup/plugin-url';

const packageJson = require("./package.json");

export default [
  {
    input: "src/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        exports: "named",
        sourcemap: true,
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ sourceMap: true, inlineSources: true }),
      terser(),
      url({
        include: ['**/*.svg','**/*.png'],
        fileName: '[name][extname]',
      }),
      copy({
        targets: [
          { src: './src/**/assets/**/*', dest: 'dist/assets' }
        ]
      }),
    ],
    external: ["react", "react-dom", "@cometchat-pro/chat", "my-cstom-package-lit", "uikit-resources-lerna", "uikit-utils-lerna"],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts.default()],
  },
];
