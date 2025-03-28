import commonjs from "@rollup/plugin-commonjs";
import copy from 'rollup-plugin-copy';
import dts from "rollup-plugin-dts";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import url from '@rollup/plugin-url';
import postcss from 'rollup-plugin-postcss';
import json from "@rollup/plugin-json";
import { writeFile } from 'fs/promises';

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
      postcss({ 
        extensions: ['.css', '.scss'],
        extract: true,
        minimize: true,
      }),
      resolve(),
      commonjs(),
      json(),
      typescript({ sourceMap: true, inlineSources: true }),
      url({
        include: ['**/*.svg', '**/*.png'],
        fileName: '[name][extname]',
      }),
      copy({
        targets: [
          { src: './src/**/assets/**/*', dest: 'dist/assets' } ,
          { src: 'src/styles/**/*', dest: 'dist/styles' },
          { src: 'src/fonts/**/*', dest: 'dist/fonts' }
         ]
      }),
      terser(),
    ],
    external: ["react", "react-dom","react/jsx-runtime", "@cometchat/chat-sdk-javascript",  "@cometchat/calls-sdk-javascript"],
  },
  {
    input: "src/index.ts",
    output: [{ file: "dist/index.d.ts", format: "es" }],
    plugins: [dts.default()],
  },
];
