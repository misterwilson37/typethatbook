// Lets Node load the site's real browser modules (score-save.js, privacy-tools.js),
// which import Firebase from www.gstatic.com URLs, by pointing those URLs at the npm
// "firebase" package of the same version. The files under test are NOT modified.
import { register } from 'node:module';
register('./gstatic-hooks.mjs', import.meta.url);
