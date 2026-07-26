/** Type declaration for plain CSS imports (side-effect only). */
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

declare module '*.svg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}

declare module '*.mp3' {
  const src: string;
  export default src;
}
