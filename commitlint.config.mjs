// Conventional Commits: `type(scope): subject`. Only the shape is enforced (a known
// type, a non-empty subject); subject casing is free so acronyms like E2E, SDK or
// CI can lead. Long headers and body lines warn instead of failing — trailers like
// Co-Authored-By routinely exceed 100 chars.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    'header-max-length': [1, 'always', 100],
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
