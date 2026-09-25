// Same as the Tailwind CDN's default config. Content = every page and script in the repo root.
const path = require('path');
module.exports = {
  content: [path.join(__dirname, '../*.html'), path.join(__dirname, '../*.js')],
  theme: { extend: {} },
  plugins: []
};
