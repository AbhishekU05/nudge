import { mockStore } from "./store";

export class RedirectError extends Error {
  digest: string;
  url: string;

  constructor(url: string) {
    super(`NEXT_REDIRECT: ${url}`);
    this.name = "RedirectError";
    this.digest = `NEXT_REDIRECT;307;${url};temporary;`;
    this.url = url;
  }
}

export function redirect(url: string): never {
  mockStore.redirects.push(url);
  throw new RedirectError(url);
}

export function revalidatePath(path: string, type?: string) {
  mockStore.revalidatedPaths.push({ path, type });
}

export function unstable_cache<T extends (...args: any[]) => any>(
  fn: T,
  keys?: string[],
  options?: any
): T {
  return fn;
}

export class MockCookieStore {
  get(name: string) {
    return mockStore.cookies.get(name);
  }
  set(name: string, value: string, options?: any) {
    mockStore.cookies.set(name, { value, options });
    return this;
  }
  delete(name: string) {
    mockStore.cookies.delete(name);
    return this;
  }
}

export function cookies() {
  return Promise.resolve(new MockCookieStore());
}
