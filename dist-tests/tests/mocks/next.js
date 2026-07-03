"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockCookieStore = exports.RedirectError = void 0;
exports.redirect = redirect;
exports.revalidatePath = revalidatePath;
exports.unstable_cache = unstable_cache;
exports.cookies = cookies;
const store_1 = require("./store");
class RedirectError extends Error {
    constructor(url) {
        super(`NEXT_REDIRECT: ${url}`);
        this.name = "RedirectError";
        this.digest = `NEXT_REDIRECT;307;${url};temporary;`;
        this.url = url;
    }
}
exports.RedirectError = RedirectError;
function redirect(url) {
    store_1.mockStore.redirects.push(url);
    throw new RedirectError(url);
}
function revalidatePath(path, type) {
    store_1.mockStore.revalidatedPaths.push({ path, type });
}
function unstable_cache(fn, keys, options) {
    return fn;
}
class MockCookieStore {
    get(name) {
        return store_1.mockStore.cookies.get(name);
    }
    set(name, value, options) {
        store_1.mockStore.cookies.set(name, { value, options });
        return this;
    }
    delete(name) {
        store_1.mockStore.cookies.delete(name);
        return this;
    }
}
exports.MockCookieStore = MockCookieStore;
function cookies() {
    return Promise.resolve(new MockCookieStore());
}
