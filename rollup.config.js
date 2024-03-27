import commonjs from "@rollup/plugin-commonjs";
import copy from 'rollup-plugin-copy';
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import { terser } from "rollup-plugin-terser";
import typescript from "@rollup/plugin-typescript";
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
    external: ["react", "react-dom", "@cometchat/chat-sdk-javascript", "@cometchat/uikit-elements", "@cometchat/uikit-resources", "@cometchat/uikit-shared", "@cometchat/calls-sdk-javascript"],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts.default()],
  },
];
