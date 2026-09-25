const GSTATIC = /^https:\/\/www\.gstatic\.com\/firebasejs\/[\d.]+\/firebase-([a-z]+)\.js$/;
const HERE = new URL('./package.json', import.meta.url).href;
export async function resolve(specifier, context, next) {
    const m = specifier.match(GSTATIC);
    if (m) return next(`firebase/${m[1]}`, { ...context, parentURL: HERE });
    return next(specifier, context);
}
