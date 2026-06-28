var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// node_modules/hono/dist/middleware/cors/index.js
var cors = /* @__PURE__ */ __name((options) => {
  const opts = {
    origin: "*",
    allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    allowHeaders: [],
    exposeHeaders: [],
    ...options
  };
  const findAllowOrigin = ((optsOrigin) => {
    if (typeof optsOrigin === "string") {
      if (optsOrigin === "*") {
        return () => optsOrigin;
      } else {
        return (origin) => optsOrigin === origin ? origin : null;
      }
    } else if (typeof optsOrigin === "function") {
      return optsOrigin;
    } else {
      return (origin) => optsOrigin.includes(origin) ? origin : null;
    }
  })(opts.origin);
  const findAllowMethods = ((optsAllowMethods) => {
    if (typeof optsAllowMethods === "function") {
      return optsAllowMethods;
    } else if (Array.isArray(optsAllowMethods)) {
      return () => optsAllowMethods;
    } else {
      return () => [];
    }
  })(opts.allowMethods);
  return /* @__PURE__ */ __name(async function cors2(c, next) {
    function set(key, value) {
      c.res.headers.set(key, value);
    }
    __name(set, "set");
    const allowOrigin = await findAllowOrigin(c.req.header("origin") || "", c);
    if (allowOrigin) {
      set("Access-Control-Allow-Origin", allowOrigin);
    }
    if (opts.credentials) {
      set("Access-Control-Allow-Credentials", "true");
    }
    if (opts.exposeHeaders?.length) {
      set("Access-Control-Expose-Headers", opts.exposeHeaders.join(","));
    }
    if (c.req.method === "OPTIONS") {
      if (opts.origin !== "*") {
        set("Vary", "Origin");
      }
      if (opts.maxAge != null) {
        set("Access-Control-Max-Age", opts.maxAge.toString());
      }
      const allowMethods = await findAllowMethods(c.req.header("origin") || "", c);
      if (allowMethods.length) {
        set("Access-Control-Allow-Methods", allowMethods.join(","));
      }
      let headers = opts.allowHeaders;
      if (!headers?.length) {
        const requestHeaders = c.req.header("Access-Control-Request-Headers");
        if (requestHeaders) {
          headers = requestHeaders.split(/\s*,\s*/);
        }
      }
      if (headers?.length) {
        set("Access-Control-Allow-Headers", headers.join(","));
        c.res.headers.append("Vary", "Access-Control-Request-Headers");
      }
      c.res.headers.delete("Content-Length");
      c.res.headers.delete("Content-Type");
      return new Response(null, {
        headers: c.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await next();
    if (opts.origin !== "*") {
      c.header("Vary", "Origin", { append: true });
    }
  }, "cors2");
}, "cors");

// public/stat-calculator.js
var STAT_SHORT_NAMES = ["HP", "atk", "def", "spA", "spD", "spe"];
var BASE_STATS_KEY_MAP = {
  HP: "HP",
  atk: "Attack",
  def: "Defense",
  spA: "Special Attack",
  spD: "Special Defense",
  spe: "Speed"
};
function getNatureModifier(statName, nature) {
  if (!nature) return 0;
  if (nature.raise === nature.lower) return 0;
  if (statName === "HP") {
    if (nature.raise === statName) return 1;
    if (nature.lower === statName) return -1;
    return 0;
  }
  if (nature.raise === statName) return 2;
  if (nature.lower === statName) return -2;
  return 0;
}
__name(getNatureModifier, "getNatureModifier");
function getBaseStatsWithNature(baseStats, nature) {
  const baseWithNature = {};
  STAT_SHORT_NAMES.forEach((statName) => {
    const raw2 = baseStats?.[BASE_STATS_KEY_MAP[statName]] || 0;
    baseWithNature[statName] = Math.max(1, raw2 + getNatureModifier(statName, nature));
  });
  return baseWithNature;
}
__name(getBaseStatsWithNature, "getBaseStatsWithNature");
function groupStatsByValue(baseWithNature) {
  const groups = [];
  const processed = /* @__PURE__ */ new Set();
  Object.entries(baseWithNature).forEach(([stat, value]) => {
    if (processed.has(stat)) return;
    const group = [stat];
    processed.add(stat);
    Object.entries(baseWithNature).forEach(([otherStat, otherValue]) => {
      if (otherStat !== stat && !processed.has(otherStat) && value === otherValue) {
        group.push(otherStat);
        processed.add(otherStat);
      }
    });
    groups.push({ stats: group, baseValue: value });
  });
  return groups.sort((a, b) => b.baseValue - a.baseValue);
}
__name(groupStatsByValue, "groupStatsByValue");
function normalizeIgnoreBaseRelation(ignoreBaseRelation) {
  if (ignoreBaseRelation === void 0 || ignoreBaseRelation === null) {
    return void 0;
  }
  const rawValue = String(ignoreBaseRelation).trim();
  if (!rawValue) {
    return void 0;
  }
  if (rawValue.toUpperCase() === "IGNORE") {
    return "IGNORE";
  }
  const statAliases = {
    HP: "HP",
    H: "HP",
    ATK: "atk",
    ATTACK: "atk",
    DEF: "def",
    DEFENSE: "def",
    SPA: "spA",
    SPATK: "spA",
    SPECIALATTACK: "spA",
    SPD: "spD",
    SPDEF: "spD",
    SPECIALDEFENSE: "spD",
    SPE: "spe",
    SPEED: "spe"
  };
  const normalizedStats = rawValue.split(",").map((stat) => stat.trim()).filter(Boolean).map((stat) => statAliases[stat.replace(/[\s._-]+/g, "").toUpperCase()] || stat).filter((stat, index, stats) => stats.indexOf(stat) === index);
  return normalizedStats.length > 0 ? normalizedStats.join(",") : void 0;
}
__name(normalizeIgnoreBaseRelation, "normalizeIgnoreBaseRelation");
function getStatGroups(baseWithNature, ignoreBaseRelation) {
  const normalizedIgnoreBaseRelation = normalizeIgnoreBaseRelation(ignoreBaseRelation);
  if (normalizedIgnoreBaseRelation === "IGNORE") {
    return STAT_SHORT_NAMES.map((stat) => ({
      stats: [stat],
      baseValue: baseWithNature[stat]
    }));
  }
  if (!normalizedIgnoreBaseRelation) {
    return groupStatsByValue(baseWithNature);
  }
  const ignoredStats = normalizedIgnoreBaseRelation.split(",").map((stat) => stat.trim());
  const groupedStats = groupStatsByValue(baseWithNature);
  return groupedStats.flatMap((group) => {
    const ignoredInGroup = group.stats.filter((stat) => ignoredStats.includes(stat));
    if (ignoredInGroup.length === 0) {
      return [group];
    }
    if (ignoredInGroup.length === group.stats.length) {
      return ignoredInGroup.map((stat) => ({
        stats: [stat],
        baseValue: baseWithNature[stat]
      }));
    }
    const keptStats = group.stats.filter((stat) => !ignoredStats.includes(stat));
    return [
      { stats: keptStats, baseValue: baseWithNature[keptStats[0]] },
      ...ignoredInGroup.map((stat) => ({
        stats: [stat],
        baseValue: baseWithNature[stat]
      }))
    ];
  });
}
__name(getStatGroups, "getStatGroups");
function initDistributedPoints() {
  const distributedPoints = {};
  STAT_SHORT_NAMES.forEach((stat) => {
    distributedPoints[stat] = 0;
  });
  return distributedPoints;
}
__name(initDistributedPoints, "initDistributedPoints");
function getSortedRelationGroups(groups) {
  return [...groups].sort((a, b) => b.baseValue - a.baseValue);
}
__name(getSortedRelationGroups, "getSortedRelationGroups");
function buildStatToGroupMap(groups) {
  const statToGroup = {};
  groups.forEach((group) => {
    group.stats.forEach((stat) => {
      statToGroup[stat] = group;
    });
  });
  return statToGroup;
}
__name(buildStatToGroupMap, "buildStatToGroupMap");
function getGroupDistributedPoints(distributedPoints, group) {
  return group.stats.reduce((sum, stat) => sum + (distributedPoints[stat] || 0), 0);
}
__name(getGroupDistributedPoints, "getGroupDistributedPoints");
function getGroupFinalValues(distributedPoints, group) {
  return group.stats.map((stat) => group.baseValue + (distributedPoints[stat] || 0));
}
__name(getGroupFinalValues, "getGroupFinalValues");
function wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation = true) {
  if (!enforceBaseRelation) {
    return true;
  }
  const nextPoints = {
    ...distributedPoints,
    [statToIncrement]: (distributedPoints[statToIncrement] || 0) + 1
  };
  for (const group of relationGroups) {
    if (group.stats.length <= 1) continue;
    const finalValues = getGroupFinalValues(nextPoints, group);
    const minFinal = Math.min(...finalValues);
    const maxFinal = Math.max(...finalValues);
    if (maxFinal - minFinal > 1) {
      return false;
    }
  }
  for (let index = 0; index < relationGroups.length - 1; index++) {
    const higherGroup = relationGroups[index];
    const lowerGroup = relationGroups[index + 1];
    if (higherGroup.baseValue === lowerGroup.baseValue) {
      continue;
    }
    const higherFinalMin = Math.min(...getGroupFinalValues(nextPoints, higherGroup));
    const lowerFinalMax = Math.max(...getGroupFinalValues(nextPoints, lowerGroup));
    if (higherFinalMin <= lowerFinalMax) {
      return false;
    }
  }
  return true;
}
__name(wouldKeepBaseRelation, "wouldKeepBaseRelation");
function getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation = true) {
  const relationGroups = getSortedRelationGroups(groups);
  return relationGroups.flatMap((group) => group.stats).filter((stat) => wouldKeepBaseRelation(distributedPoints, stat, relationGroups, enforceBaseRelation));
}
__name(getValidDistributionCandidates, "getValidDistributionCandidates");
function distributePointsWithBaseRelation(totalPoints, groups, distribution = "RANDOM", enforceBaseRelation = true) {
  const normalizedDistribution = ["BALANCED", "MINMAXED"].includes(distribution) ? distribution : "RANDOM";
  const sortedGroups = getSortedRelationGroups(groups);
  const statToGroup = buildStatToGroupMap(sortedGroups);
  const distributedPoints = initDistributedPoints();
  const totalWeight = sortedGroups.reduce((sum, group) => sum + Math.max(1, group.baseValue), 0);
  for (let pointIndex = 0; pointIndex < totalPoints; pointIndex++) {
    const candidates = getValidDistributionCandidates(distributedPoints, sortedGroups, enforceBaseRelation);
    if (candidates.length === 0) {
      console.warn("No valid stat candidate while preserving Base Relation; distribution stopped early.");
      break;
    }
    let selectedStat;
    if (normalizedDistribution === "RANDOM") {
      selectedStat = candidates[Math.floor(Math.random() * candidates.length)];
    } else if (normalizedDistribution === "MINMAXED") {
      selectedStat = [...candidates].sort((a, b) => {
        const groupA = statToGroup[a];
        const groupB = statToGroup[b];
        const targetA = Math.max(1, groupA.baseValue) / totalWeight * (pointIndex + 1);
        const targetB = Math.max(1, groupB.baseValue) / totalWeight * (pointIndex + 1);
        const deficitA = targetA - getGroupDistributedPoints(distributedPoints, groupA);
        const deficitB = targetB - getGroupDistributedPoints(distributedPoints, groupB);
        return deficitB - deficitA || groupB.baseValue - groupA.baseValue || (distributedPoints[a] || 0) - (distributedPoints[b] || 0) || STAT_SHORT_NAMES.indexOf(a) - STAT_SHORT_NAMES.indexOf(b);
      })[0];
    } else {
      selectedStat = [...candidates].sort((a, b) => {
        const groupA = statToGroup[a];
        const groupB = statToGroup[b];
        const finalA = groupA.baseValue + (distributedPoints[a] || 0);
        const finalB = groupB.baseValue + (distributedPoints[b] || 0);
        return (distributedPoints[a] || 0) - (distributedPoints[b] || 0) || finalA - finalB || STAT_SHORT_NAMES.indexOf(a) - STAT_SHORT_NAMES.indexOf(b);
      })[0];
    }
    distributedPoints[selectedStat] = (distributedPoints[selectedStat] || 0) + 1;
  }
  return distributedPoints;
}
__name(distributePointsWithBaseRelation, "distributePointsWithBaseRelation");
function distributePointsRandom(totalPoints, groups, enforceBaseRelation = true) {
  return distributePointsWithBaseRelation(totalPoints, groups, "RANDOM", enforceBaseRelation);
}
__name(distributePointsRandom, "distributePointsRandom");
function distributePointsBalanced(totalPoints, groups, enforceBaseRelation = true) {
  return distributePointsWithBaseRelation(totalPoints, groups, "BALANCED", enforceBaseRelation);
}
__name(distributePointsBalanced, "distributePointsBalanced");
function distributePointsMinmaxed(totalPoints, groups, enforceBaseRelation = true) {
  return distributePointsWithBaseRelation(totalPoints, groups, "MINMAXED", enforceBaseRelation);
}
__name(distributePointsMinmaxed, "distributePointsMinmaxed");
function getDistributedPoints(baseStats, level, nature, distribution = "RANDOM", ignoreBaseRelation = void 0) {
  const normalizedIgnoreBaseRelation = normalizeIgnoreBaseRelation(ignoreBaseRelation);
  const baseWithNature = getBaseStatsWithNature(baseStats, nature);
  const groups = getStatGroups(baseWithNature, normalizedIgnoreBaseRelation);
  const normalizedDistribution = ["BALANCED", "MINMAXED"].includes(distribution) ? distribution : "RANDOM";
  return {
    baseWithNature,
    groups,
    distributedPoints: distributePointsWithBaseRelation(
      level + 10,
      groups,
      normalizedDistribution,
      normalizedIgnoreBaseRelation !== "IGNORE"
    ),
    distribution: normalizedDistribution,
    ignoreBaseRelation: normalizedIgnoreBaseRelation
  };
}
__name(getDistributedPoints, "getDistributedPoints");
function calculateStats(baseStats, level, nature, distribution = "RANDOM", ignoreBaseRelation = void 0) {
  const stats = {};
  const { baseWithNature, distributedPoints } = getDistributedPoints(
    baseStats,
    level,
    nature,
    distribution,
    ignoreBaseRelation
  );
  STAT_SHORT_NAMES.forEach((shortName) => {
    stats[shortName] = baseWithNature[shortName] + (distributedPoints[shortName] || 0);
  });
  return stats;
}
__name(calculateStats, "calculateStats");
globalThis.PTUStatCalc = {
  STAT_SHORT_NAMES,
  BASE_STATS_KEY_MAP,
  getNatureModifier,
  getBaseStatsWithNature,
  groupStatsByValue,
  normalizeIgnoreBaseRelation,
  getStatGroups,
  initDistributedPoints,
  getSortedRelationGroups,
  buildStatToGroupMap,
  getGroupDistributedPoints,
  getGroupFinalValues,
  wouldKeepBaseRelation,
  getValidDistributionCandidates,
  distributePointsWithBaseRelation,
  distributePointsRandom,
  distributePointsBalanced,
  distributePointsMinmaxed,
  getDistributedPoints,
  calculateStats
};

// utils/pokemonGenerator.js
var statCalc = globalThis.PTUStatCalc;
var DATASETS_BASE_URL = "https://sewef.github.io/ptu/data/";
var DAMAGE_BASE_TABLE = {
  1: { dmg: "1d6+1", min: 2, avg: 5, max: 7 },
  2: { dmg: "1d6+3", min: 4, avg: 7, max: 9 },
  3: { dmg: "1d6+5", min: 6, avg: 9, max: 11 },
  4: { dmg: "1d8+6", min: 7, avg: 11, max: 14 },
  5: { dmg: "1d8+8", min: 9, avg: 13, max: 16 },
  6: { dmg: "2d6+8", min: 10, avg: 15, max: 20 },
  7: { dmg: "2d6+10", min: 12, avg: 17, max: 22 },
  8: { dmg: "2d8+10", min: 12, avg: 19, max: 26 },
  9: { dmg: "2d10+10", min: 12, avg: 21, max: 30 },
  10: { dmg: "3d8+10", min: 13, avg: 24, max: 34 },
  11: { dmg: "3d10+10", min: 13, avg: 27, max: 40 },
  12: { dmg: "3d12+10", min: 13, avg: 30, max: 46 },
  13: { dmg: "4d10+10", min: 14, avg: 35, max: 50 },
  14: { dmg: "4d10+15", min: 19, avg: 40, max: 55 },
  15: { dmg: "4d10+20", min: 24, avg: 45, max: 60 },
  16: { dmg: "5d10+20", min: 25, avg: 50, max: 70 },
  17: { dmg: "5d12+25", min: 30, avg: 60, max: 85 },
  18: { dmg: "6d12+25", min: 31, avg: 65, max: 97 },
  19: { dmg: "6d12+30", min: 36, avg: 70, max: 102 },
  20: { dmg: "6d12+35", min: 41, avg: 75, max: 107 },
  21: { dmg: "6d12+40", min: 46, avg: 80, max: 112 },
  22: { dmg: "6d12+45", min: 51, avg: 85, max: 117 },
  23: { dmg: "6d12+50", min: 56, avg: 90, max: 122 },
  24: { dmg: "6d12+55", min: 61, avg: 95, max: 127 },
  25: { dmg: "6d12+60", min: 66, avg: 100, max: 132 },
  26: { dmg: "7d12+65", min: 72, avg: 110, max: 149 },
  27: { dmg: "8d12+70", min: 78, avg: 120, max: 166 },
  28: { dmg: "8d12+80", min: 88, avg: 130, max: 176 }
};
var DATASETS = {
  core: {
    name: "Core",
    pokedex: [
      "pokedex/core/pokedex_core.min.json",
      "pokedex/core/pokedex_7g.min.json",
      "pokedex/core/pokedex_8g.min.json",
      "pokedex/core/pokedex_8g_hisui.min.json"
    ],
    abilities: "abilities/abilities_core.min.json",
    moves: "moves/moves_core.min.json"
  },
  community: {
    name: "Community",
    pokedex: [
      "pokedex/community/pokedex_core.min.json",
      "pokedex/community/pokedex_7g.min.json",
      "pokedex/community/pokedex_8g.min.json",
      "pokedex/community/pokedex_8g_hisui.min.json",
      "pokedex/community/pokedex_9g.min.json"
    ],
    abilities: "abilities/abilities_community.min.json",
    moves: "moves/moves_community.min.json"
  },
  homebrew: {
    name: "Homebrew",
    pokedex: [
      "pokedex/homebrew/pokedex_core.min.json",
      "pokedex/homebrew/pokedex_7g.min.json",
      "pokedex/homebrew/pokedex_8g.min.json",
      "pokedex/homebrew/pokedex_8g_hisui.min.json",
      "pokedex/homebrew/pokedex_9g.min.json"
    ],
    abilities: "abilities/abilities_homebrew.min.json",
    moves: "moves/moves_homebrew.min.json"
  }
};
var FANDEX_DATASETS = {
  variant: {
    name: "Variant",
    pokedex: "pokedex/fandex/pokedex_variant.min.json"
  },
  insurgence: {
    name: "Insurgence",
    pokedex: "pokedex/fandex/pokedex_insurgence.min.json",
    abilities: "abilities/fandex/abilities_insurgence.min.json",
    moves: "moves/fandex/moves_insurgence.min.json",
    capabilities: "capabilities/fandex/capabilities_insurgence.min.json"
  },
  sage: {
    name: "Sage",
    pokedex: "pokedex/fandex/pokedex_sage.min.json",
    abilities: "abilities/fandex/abilities_sage.min.json",
    moves: "moves/fandex/moves_sage.min.json",
    capabilities: "capabilities/fandex/capabilities_sage.min.json"
  },
  uranium: {
    name: "Uranium",
    pokedex: "pokedex/fandex/pokedex_uranium.min.json",
    abilities: "abilities/fandex/abilities_uranium.min.json",
    moves: "moves/fandex/moves_uranium.min.json",
    capabilities: "capabilities/fandex/capabilities_uranium.min.json"
  },
  slimerancher: {
    name: "Slime Rancher",
    pokedex: "pokedex/fandex/pokedex_slimerancher.min.json"
  }
};
var dataCache = {};
var currentDataset = "core";
var currentFandexes = [];
var pokemonDatabase = [];
var abilitiesDatabase = {};
var movesDatabase = {};
var pokemonByName = {};
var movesMapLower = {};
var abilitiesMapLower = {};
var customPokemon = [];
var customAbilities = {};
var customMoves = {};
async function fetchDataFromURL(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    throw error;
  }
}
__name(fetchDataFromURL, "fetchDataFromURL");
function convertDamageBase(damageBaseNumber, hasStab = false) {
  if (damageBaseNumber === null || damageBaseNumber === void 0) return null;
  let dbNumber = typeof damageBaseNumber === "string" ? parseInt(damageBaseNumber) : damageBaseNumber;
  if (isNaN(dbNumber)) return null;
  if (hasStab) {
    dbNumber = Math.min(dbNumber + 2, 28);
  }
  const dbData = DAMAGE_BASE_TABLE[dbNumber];
  if (!dbData) return null;
  return {
    short: `DB${dbNumber}`,
    dmg: dbData.dmg,
    min: dbData.min,
    avg: dbData.avg,
    max: dbData.max,
    stab: hasStab
  };
}
__name(convertDamageBase, "convertDamageBase");
async function loadDataset(datasetKey) {
  if (!DATASETS[datasetKey]) {
    throw new Error(`Unknown dataset: ${datasetKey}`);
  }
  if (dataCache[datasetKey]) {
    return dataCache[datasetKey];
  }
  console.log(`Loading ${DATASETS[datasetKey].name} dataset...`);
  const dataset = DATASETS[datasetKey];
  try {
    const pokedexPromises = dataset.pokedex.map(
      (path) => fetchDataFromURL(DATASETS_BASE_URL + path)
    );
    const pokedexArrays = await Promise.all(pokedexPromises);
    const pokedexMap = /* @__PURE__ */ new Map();
    pokedexArrays.forEach((pokedexArray) => {
      pokedexArray.forEach((pokemon) => {
        const key = pokemon.Form ? `${pokemon.Species.toLowerCase()}|${pokemon.Form.toLowerCase()}` : pokemon.Species.toLowerCase();
        pokedexMap.set(key, pokemon);
      });
    });
    const mergedPokedex = Array.from(pokedexMap.values());
    const [abilities, moves] = await Promise.all([
      fetchDataFromURL(DATASETS_BASE_URL + dataset.abilities),
      fetchDataFromURL(DATASETS_BASE_URL + dataset.moves)
    ]);
    dataCache[datasetKey] = {
      pokedex: mergedPokedex,
      abilities,
      moves
    };
    console.log(`\u2713 ${DATASETS[datasetKey].name} dataset loaded successfully (${mergedPokedex.length} Pok\xE9mon)`);
    return dataCache[datasetKey];
  } catch (error) {
    console.error(`Failed to load ${DATASETS[datasetKey].name} dataset:`, error);
    throw error;
  }
}
__name(loadDataset, "loadDataset");
async function loadFandexDataset(fandexKey) {
  if (!FANDEX_DATASETS[fandexKey]) {
    throw new Error(`Unknown FanDex: ${fandexKey}`);
  }
  const cacheKey = `fandex_${fandexKey}`;
  if (dataCache[cacheKey]) {
    return dataCache[cacheKey];
  }
  console.log(`Loading ${FANDEX_DATASETS[fandexKey].name} FanDex...`);
  const fandex = FANDEX_DATASETS[fandexKey];
  try {
    const promises = [];
    const promiseIndices = {
      pokedex: null,
      abilities: null,
      moves: null,
      capabilities: null
    };
    promiseIndices.pokedex = promises.length;
    promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.pokedex));
    if (fandex.abilities) {
      promiseIndices.abilities = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.abilities));
    }
    if (fandex.moves) {
      promiseIndices.moves = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.moves));
    }
    if (fandex.capabilities) {
      promiseIndices.capabilities = promises.length;
      promises.push(fetchDataFromURL(DATASETS_BASE_URL + fandex.capabilities));
    }
    const results = await Promise.all(promises);
    const pokedex = results[promiseIndices.pokedex];
    const abilities = promiseIndices.abilities !== null ? results[promiseIndices.abilities] : {};
    const moves = promiseIndices.moves !== null ? results[promiseIndices.moves] : {};
    const capabilities = promiseIndices.capabilities !== null ? results[promiseIndices.capabilities] : {};
    dataCache[cacheKey] = {
      pokedex: Array.isArray(pokedex) ? pokedex : Object.values(pokedex),
      abilities,
      moves,
      capabilities: capabilities || {}
    };
    console.log(`\u2713 ${FANDEX_DATASETS[fandexKey].name} FanDex loaded successfully`);
    return dataCache[cacheKey];
  } catch (error) {
    console.error(`Failed to load ${FANDEX_DATASETS[fandexKey].name} FanDex:`, error);
    throw error;
  }
}
__name(loadFandexDataset, "loadFandexDataset");
async function switchDataset(datasetKey, fandexKeys = []) {
  if (!DATASETS[datasetKey]) {
    throw new Error(`Unknown dataset: ${datasetKey}`);
  }
  if (!Array.isArray(fandexKeys)) {
    fandexKeys = typeof fandexKeys === "string" ? fandexKeys.split(",").filter(Boolean) : [];
  }
  const fandexSuffix = fandexKeys.length > 0 ? `+${fandexKeys.sort().join(",")}` : "";
  const configKey = `${datasetKey}${fandexSuffix}`;
  if (currentDataset === datasetKey && currentFandexes.length === fandexKeys.length && currentFandexes.every((f) => fandexKeys.includes(f)) && pokemonDatabase.length > 0) {
    return;
  }
  const baseData = await loadDataset(datasetKey);
  const fandexDataResults = await Promise.all(fandexKeys.map((key) => loadFandexDataset(key)));
  currentDataset = datasetKey;
  currentFandexes = [...fandexKeys];
  pokemonDatabase = [...baseData.pokedex];
  movesDatabase = { ...baseData.moves };
  if (Array.isArray(baseData.abilities)) {
    const abilitiesObj = {};
    baseData.abilities.forEach((ability) => {
      if (ability.Name) abilitiesObj[ability.Name] = ability;
    });
    abilitiesDatabase = abilitiesObj;
  } else {
    abilitiesDatabase = { ...baseData.abilities };
  }
  for (let fandexIndex = 0; fandexIndex < fandexDataResults.length; fandexIndex++) {
    const fandexData = fandexDataResults[fandexIndex];
    const fandexKey = fandexKeys[fandexIndex];
    const pokedexMap = /* @__PURE__ */ new Map();
    pokemonDatabase.forEach((p) => {
      const key = p.Form ? `${p.Species.toLowerCase()}|${p.Form.toLowerCase()}` : p.Species.toLowerCase();
      pokedexMap.set(key, p);
    });
    fandexData.pokedex.forEach((p) => {
      const key = p.Form ? `${p.Species.toLowerCase()}|${p.Form.toLowerCase()}` : p.Species.toLowerCase();
      const fandexInfo = { ...p, _fandex: fandexKey };
      pokedexMap.set(key, fandexInfo);
    });
    pokemonDatabase = Array.from(pokedexMap.values());
    Object.assign(movesDatabase, fandexData.moves);
    if (Array.isArray(fandexData.abilities)) {
      fandexData.abilities.forEach((ability) => {
        if (ability.Name) abilitiesDatabase[ability.Name] = ability;
      });
    } else {
      Object.assign(abilitiesDatabase, fandexData.abilities);
    }
  }
  pokemonByName = {};
  movesMapLower = {};
  abilitiesMapLower = {};
  pokemonDatabase.forEach((pokemon) => {
    const speciesLower = pokemon.Species.toLowerCase();
    if (!pokemon.Form) {
      pokemonByName[speciesLower] = pokemon;
    }
    if (pokemon.Form) {
      const formKey = `${speciesLower}|${pokemon.Form.toLowerCase()}`;
      pokemonByName[formKey] = pokemon;
    }
  });
  Object.keys(movesDatabase).forEach((moveName) => {
    movesMapLower[moveName.toLowerCase()] = movesDatabase[moveName];
  });
  Object.keys(abilitiesDatabase).forEach((abilityName) => {
    if (typeof abilityName === "string") {
      abilitiesMapLower[abilityName.toLowerCase()] = abilitiesDatabase[abilityName];
    }
  });
}
__name(switchDataset, "switchDataset");
async function initializeDatasets() {
  try {
    await switchDataset("core");
  } catch (error) {
    console.error("Failed to initialize datasets:", error);
    throw error;
  }
}
__name(initializeDatasets, "initializeDatasets");
function extractPokemonTypes(typeField) {
  if (!typeField) return ["Normal"];
  if (Array.isArray(typeField) && typeField.length > 0 && typeof typeField[0] === "object") {
    const formeObj = typeField[0];
    const formeKeys = Object.keys(formeObj);
    if (formeKeys.length > 0) {
      const selectedForme = formeKeys[Math.floor(Math.random() * formeKeys.length)];
      return {
        isFormeVariant: true,
        formes: formeObj,
        selectedForme
      };
    }
  }
  if (Array.isArray(typeField)) {
    return typeField.filter((t) => typeof t === "string");
  }
  if (typeof typeField === "object" && !Array.isArray(typeField)) {
    const formeKeys = Object.keys(typeField);
    if (formeKeys.length > 0) {
      const selectedForme = formeKeys[Math.floor(Math.random() * formeKeys.length)];
      return {
        isFormeVariant: true,
        formes: typeField,
        selectedForme
      };
    }
  }
  return ["Normal"];
}
__name(extractPokemonTypes, "extractPokemonTypes");
function getActualTypes(extractedTypes) {
  if (!extractedTypes) return ["Normal"];
  if (extractedTypes.isFormeVariant) {
    const formes = extractedTypes.formes[extractedTypes.selectedForme];
    return Array.isArray(formes) ? formes : ["Normal"];
  }
  return Array.isArray(extractedTypes) ? extractedTypes : ["Normal"];
}
__name(getActualTypes, "getActualTypes");
function extractBaseStats(baseStatsField) {
  if (!baseStatsField) return {};
  if (baseStatsField.HP !== void 0 || baseStatsField.Attack !== void 0) {
    return baseStatsField;
  }
  const variantKeys = Object.keys(baseStatsField).filter(
    (key) => typeof baseStatsField[key] === "object" && (baseStatsField[key].HP !== void 0 || baseStatsField[key].Attack !== void 0)
  );
  if (variantKeys.length > 0) {
    const selectedVariant = variantKeys[Math.floor(Math.random() * variantKeys.length)];
    return {
      isStatVariant: true,
      variants: baseStatsField,
      selectedVariant,
      stats: baseStatsField[selectedVariant]
    };
  }
  return baseStatsField;
}
__name(extractBaseStats, "extractBaseStats");
function getActualBaseStats(extractedStats) {
  if (!extractedStats) return {};
  if (extractedStats.isStatVariant) {
    return extractedStats.stats || {};
  }
  return extractedStats;
}
__name(getActualBaseStats, "getActualBaseStats");
var PokemonGenerator = class {
  static {
    __name(this, "PokemonGenerator");
  }
  /**
   * Generate a random Pokemon with PTU 1.05 stats
   * @param {Object} options - Generation options
   * @param {number} options.level - Pokemon level (1-100)
   * @param {number} options.minLevel - Minimum level for random range
   * @param {number} options.maxLevel - Maximum level for random range
   * @param {string} options.species - Specific species to generate
   * @param {string} options.type - Specific type to generate (random Pokemon of that type)
   * @param {string} options.habitat - Specific habitat to generate (random Pokemon from that habitat)
   * @param {boolean} options.shiny - Force shiny
   * @param {string} options.distribution - RANDOM (default), BALANCED, or MINMAXED
   * @param {string} options.ignoreBaseRelation - 'IGNORE' (all stats) or comma-separated list (e.g., 'HP,ATK,DEF')
   * @param {string} options.hpFormula - Custom HP formula. Default: 'LEVEL + (HP * 3) + 10'
   * @param {string} options.dataset - Dataset to use: 'core', 'community', 'homebrew'. Default: 'core'
   * @param {string|string[]} options.fandex - FanDexes to apply as overrides. Comma-separated or array.
   * @param {string} options.nature - Specific nature name to use. If not specified, a random nature is chosen
   * @returns {Object} Generated Pokemon
   */
  static async generatePokemon(options = {}) {
    const dataset = (options.dataset || "core").toLowerCase();
    const fandex = options.fandex || [];
    const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
    if (dataset !== currentDataset || fandexArray.length !== currentFandexes.length || !fandexArray.every((f) => currentFandexes.includes(f))) {
      await switchDataset(dataset, fandexArray);
    }
    let level;
    if (options.minlevel !== void 0 && options.maxlevel !== void 0) {
      let min = Math.max(1, parseInt(options.minlevel) || 1);
      let max = Math.min(100, parseInt(options.maxlevel) || 100);
      if (min > max) {
        [min, max] = [max, min];
      }
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (options.level !== void 0) {
      const parsed = parseInt(options.level);
      level = isNaN(parsed) ? 50 : parsed;
    } else {
      level = Math.floor(Math.random() * 50) + 1;
    }
    level = Math.min(Math.max(level, 1), 100);
    const includeLegendaries = options.includelegendaries === "true" || options.includelegendaries === true;
    let species = options.species ? this.getSpeciesByName(options.species) : options.type ? this.getRandomSpeciesByType(options.type, includeLegendaries) : options.habitat ? this.getRandomSpeciesByHabitat(options.habitat, includeLegendaries) : this.getRandomSpecies(includeLegendaries);
    if (!species) {
      throw new Error(`Species not found: ${options.species}`);
    }
    if (options.randomform === true || options.randomform === "true") {
      const allForms = this.getAllFormsOfSpecies(species.Species);
      if (allForms.length > 1) {
        species = allForms[Math.floor(Math.random() * allForms.length)];
      }
    }
    if (options.forceevolution === "true" || options.forceevolution === true) {
      if (!options.species) {
        species = this.getBaseFormOfEvolutionChain(species);
      }
      species = this.selectEvolvedSpecies(species, level);
    }
    const nature = options.nature ? this.getNatureByName(options.nature) : this.selectNature();
    const distribution = (options.distribution || "RANDOM").toUpperCase();
    const ignoreBaseRelation = this.normalizeIgnoreBaseRelation(options.ignorebaserelation);
    const hpFormula = options.hpformula || "LEVEL + (HP * 3) + 10";
    const extractedStats = extractBaseStats(species["Base Stats"]);
    const baseStatsData = getActualBaseStats(extractedStats);
    const stats = this.calculateStats(baseStatsData, level, nature, distribution, ignoreBaseRelation);
    const abilityNames = this.selectAbilities(species, level);
    const abilitiesWithDefinitions = abilityNames.map((abilityName) => {
      const definition = this.getAbilityDefinition(abilityName);
      if (!definition) {
        return { name: abilityName };
      }
      const normalizedAbility = this.normalizeAbilityFields(abilityName, definition);
      return normalizedAbility;
    });
    const otherInfo = species["Other Information"] || {};
    const sizeInfo = otherInfo["Size Information"] || {};
    const heightStr = sizeInfo.Height || "";
    const heightMatch = heightStr.match(/\(([^)]+)\)/);
    const sizeCategory = heightMatch ? heightMatch[1] : "Unknown";
    const weightStr = sizeInfo.Weight || "";
    const weightMatch = weightStr.match(/Weight Class (\d+)/);
    const weightClass = weightMatch ? parseInt(weightMatch[1]) : 0;
    const gendersStr = otherInfo.Genders || "Unknown";
    let gender = "Unknown";
    if (gendersStr !== "Unknown") {
      const maleMatch = gendersStr.match(/(\d+(?:\.\d+)?)\%\s*Male/);
      const malePercent = maleMatch ? parseFloat(maleMatch[1]) : 0;
      gender = Math.random() * 100 < malePercent ? "Male" : "Female";
    }
    const baseWithNature = statCalc.getBaseStatsWithNature(baseStatsData, nature);
    const extractedTypes = extractPokemonTypes(species["Basic Information"].Type);
    const actualTypes = getActualTypes(extractedTypes);
    const displayName = species.Form ? `${species.Species} (${species.Form})` : species.Species;
    const pokemon = {
      id: species.Number,
      Icon: species.Icon,
      name: displayName,
      displayName,
      baseName: species.Species,
      form: species.Form || null,
      level,
      types: extractedTypes,
      actualTypes,
      abilities: abilitiesWithDefinitions,
      shiny: options.shiny === true ? true : Math.random() < (options.shinyodds || 1) / 100,
      // Use custom odds or default 1%
      nature,
      baseStats: {
        HP: baseStatsData?.HP || 0,
        Attack: baseStatsData?.Attack || 0,
        Defense: baseStatsData?.Defense || 0,
        "Special Attack": baseStatsData?.["Special Attack"] || 0,
        "Special Defense": baseStatsData?.["Special Defense"] || 0,
        Speed: baseStatsData?.Speed || 0
      },
      statVariant: extractedStats.isStatVariant ? { selectedVariant: extractedStats.selectedVariant } : void 0,
      baseWithNature,
      stats,
      hitPoints: this.calculateHitPoints(level, stats.HP, hpFormula),
      hpFormula,
      ignoreBaseRelation,
      moves: this.selectMovesForPokemon(species, level, 6),
      item: this.selectItem(),
      skills: species.Skills || {},
      otherInfo: {
        sizeCategory,
        weightClass,
        gender,
        diet: otherInfo.Diet || "Unknown",
        habitat: (otherInfo.Habitat || "Unknown").split(",").map((h) => h.trim()).join(", ")
      },
      capabilities: species.Capabilities || [],
      legendary: species.Legendary || false,
      _fandex: species._fandex,
      dataset,
      fandex: fandexArray,
      learnsets: {
        moveLearns: species.Moves || {},
        abilityLearns: {
          basicAbilities: [
            species["Basic Information"] && species["Basic Information"]["Basic Ability 1"] || null,
            species["Basic Information"] && species["Basic Information"]["Basic Ability 2"] || null
          ].filter((a) => a != null && a !== "").map((a) => this.getAbilityLearnsetEntry(a)),
          advancedAbilities: [
            species["Basic Information"] && species["Basic Information"]["Adv Ability 1"] || null,
            species["Basic Information"] && species["Basic Information"]["Adv Ability 2"] || null
          ].filter((a) => a != null && a !== "").map((a) => this.getAbilityLearnsetEntry(a)),
          highAbilities: [
            species["Basic Information"] && species["Basic Information"]["High Ability"] || null
          ].filter((a) => a != null && a !== "").map((a) => this.getAbilityLearnsetEntry(a))
        }
      },
      includedLegendary: includeLegendaries
    };
    return pokemon;
  }
  /**
   * Calculate Hit Points based on level and HP stat
   * @param {number} level - Pokemon level
   * @param {number} hpStat - Pokemon HP stat value
   * @param {string} formula - Formula string (e.g., 'LEVEL + (HP * 3) + 10')
   * @returns {number} Calculated Hit Points
   */
  static calculateHitPoints(level, hpStat, formula = "LEVEL + (HP * 3) + 10") {
    let hp;
    try {
      const sanitized = formula.toUpperCase().replace(/[^0-9+\-*/(). LEVEL HP]/g, "");
      if (sanitized !== formula.toUpperCase() || sanitized.length === 0) {
        throw new Error("Invalid formula");
      }
      const calcFunction = new Function("LEVEL", "HP", `return ${sanitized}`);
      hp = Math.max(1, Math.floor(calcFunction(level, hpStat)));
    } catch (e) {
      console.warn(`Invalid HP formula "${formula}", using default`);
      hp = Math.max(1, Math.floor(level + hpStat * 3 + 10));
    }
    return hp;
  }
  /**
   * Generate a wild Pokemon at specific level
   */
  static async generateWildPokemon(level = 15, dataset = "core") {
    return this.generatePokemon({ level: Math.max(1, Math.min(100, level)), dataset });
  }
  /**
   * Generate a team of 6 Pokemon
   */
  static async generateTeam(options = {}) {
    const team = [];
    const count = options.size || 6;
    const level = options.level || 50;
    const dataset = options.dataset || "core";
    const includeLegendaries = options.includelegendaries === "true" || options.includelegendaries === true;
    for (let i = 0; i < count; i++) {
      team.push(await this.generatePokemon({ level, dataset, includelegendaries: includeLegendaries }));
    }
    return {
      pokemon: team,
      count: team.length,
      averageLevel: level,
      dataset,
      includedLegendaries: includeLegendaries,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  /**
   * Normalize ignoreBaseRelation so only the special value IGNORE is upper-cased.
   * Individual stat names must remain in statCalc's canonical short-name format
   * (HP, atk, def, spA, spD, spe), otherwise partial ignores like "atk,def"
   * do not match the generated stat groups.
   */
  static normalizeIgnoreBaseRelation(ignoreBaseRelation) {
    return statCalc.normalizeIgnoreBaseRelation(ignoreBaseRelation);
  }
  static getStatOrder() {
    return statCalc.STAT_SHORT_NAMES;
  }
  static initDistributedPoints() {
    return statCalc.initDistributedPoints();
  }
  static getSortedRelationGroups(groups) {
    return statCalc.getSortedRelationGroups(groups);
  }
  static buildStatToGroupMap(groups) {
    return statCalc.buildStatToGroupMap(groups);
  }
  static getGroupDistributedPoints(distributedPoints, group) {
    return statCalc.getGroupDistributedPoints(distributedPoints, group);
  }
  static getGroupFinalValues(distributedPoints, group) {
    return statCalc.getGroupFinalValues(distributedPoints, group);
  }
  static wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation = true) {
    return statCalc.wouldKeepBaseRelation(distributedPoints, statToIncrement, relationGroups, enforceBaseRelation);
  }
  static getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation = true) {
    return statCalc.getValidDistributionCandidates(distributedPoints, groups, enforceBaseRelation);
  }
  static distributePointsWithBaseRelation(totalPoints, groups, distribution = "RANDOM", enforceBaseRelation = true) {
    return statCalc.distributePointsWithBaseRelation(totalPoints, groups, distribution, enforceBaseRelation);
  }
  /**
   * Calculate stats based on base stats and level with PTU 1.05 rules
   * - Base stats from pokedex
   * - Nature: +2 or -2 to stat (except HP: +1 or -1)
   * - Start with 10 points to distribute
   * - Gain 1 point per level to distribute
   * - Base Relation: equal stats stay as even as possible, order is preserved (can be ignored)
   * - Distribution mode: RANDOM, BALANCED, or MINMAXED
   * - ignoreBaseRelation: 'IGNORE' to disable Base Relation, or comma-separated stats to exclude from grouping
   */
  static calculateStats(baseStats, level, nature, distribution = "RANDOM", ignoreBaseRelation = void 0) {
    return statCalc.calculateStats(baseStats, level, nature, distribution, ignoreBaseRelation);
  }
  /**
   * Select abilities for a Pokemon based on its level
   * Level 1: 1 Basic Ability
   * Level 20+: Add 1 random from Basic/Advanced abilities
   * Level 40+: Add 1 random from any abilities
   */
  static selectAbilities(species, level) {
    const basicInfo = species["Basic Information"];
    const abilities = [];
    const getAllAbilityOptions = /* @__PURE__ */ __name((ability) => {
      if (Array.isArray(ability)) {
        return ability;
      }
      return [ability];
    }, "getAllAbilityOptions");
    const resolveAbilitySlot = /* @__PURE__ */ __name((slotValue) => {
      const options = getAllAbilityOptions(slotValue || []);
      if (options.length === 0) return null;
      return options[Math.floor(Math.random() * options.length)];
    }, "resolveAbilitySlot");
    const basic1 = resolveAbilitySlot(basicInfo["Basic Ability 1"]);
    const basic2 = resolveAbilitySlot(basicInfo["Basic Ability 2"]);
    const adv1 = resolveAbilitySlot(basicInfo["Adv Ability 1"]);
    const adv2 = resolveAbilitySlot(basicInfo["Adv Ability 2"]);
    const high = resolveAbilitySlot(basicInfo["High Ability"]);
    const basicAbilities = [basic1, basic2].filter((a) => a !== null);
    if (basicAbilities.length > 0) {
      abilities.push(basicAbilities[Math.floor(Math.random() * basicAbilities.length)]);
    }
    if (level >= 20) {
      const available = [basic1, basic2, adv1, adv2].filter((a) => a !== null && !abilities.includes(a));
      if (available.length > 0) {
        abilities.push(available[Math.floor(Math.random() * available.length)]);
      }
    }
    if (level >= 40) {
      const available = [basic1, basic2, adv1, adv2, high].filter((a) => a !== null && !abilities.includes(a));
      if (available.length > 0) {
        abilities.push(available[Math.floor(Math.random() * available.length)]);
      }
    }
    return abilities;
  }
  /**
   * Select a random nature with stat modifiers
   */
  static selectNature() {
    return this.getAllNatures()[Math.floor(Math.random() * this.getAllNatures().length)];
  }
  /**
   * Get all available natures
   */
  static getAllNatures() {
    return [
      { name: "Cuddly", raise: "HP", lower: "atk" },
      { name: "Distracted", raise: "HP", lower: "def" },
      { name: "Proud", raise: "HP", lower: "spA" },
      { name: "Decisive", raise: "HP", lower: "spD" },
      { name: "Patient", raise: "HP", lower: "spe" },
      { name: "Desperate", raise: "atk", lower: "HP" },
      { name: "Lonely", raise: "atk", lower: "def" },
      { name: "Adamant", raise: "atk", lower: "spA" },
      { name: "Naughty", raise: "atk", lower: "spD" },
      { name: "Brave", raise: "atk", lower: "spe" },
      { name: "Stark", raise: "def", lower: "HP" },
      { name: "Bold", raise: "def", lower: "atk" },
      { name: "Impish", raise: "def", lower: "spA" },
      { name: "Lax", raise: "def", lower: "spD" },
      { name: "Relaxed", raise: "def", lower: "spe" },
      { name: "Curious", raise: "spA", lower: "HP" },
      { name: "Modest", raise: "spA", lower: "atk" },
      { name: "Mild", raise: "spA", lower: "def" },
      { name: "Rash", raise: "spA", lower: "spD" },
      { name: "Quiet", raise: "spA", lower: "spe" },
      { name: "Dreamy", raise: "spD", lower: "HP" },
      { name: "Calm", raise: "spD", lower: "atk" },
      { name: "Gentle", raise: "spD", lower: "def" },
      { name: "Careful", raise: "spD", lower: "spA" },
      { name: "Sassy", raise: "spD", lower: "spe" },
      { name: "Skittish", raise: "spe", lower: "HP" },
      { name: "Timid", raise: "spe", lower: "atk" },
      { name: "Hasty", raise: "spe", lower: "def" },
      { name: "Jolly", raise: "spe", lower: "spA" },
      { name: "Naive", raise: "spe", lower: "spD" },
      { name: "Composed", raise: "HP", lower: "HP" },
      { name: "Hardy", raise: "atk", lower: "atk" },
      { name: "Docile", raise: "def", lower: "def" },
      { name: "Bashful", raise: "spA", lower: "spA" },
      { name: "Quirky", raise: "spD", lower: "spD" },
      { name: "Serious", raise: "spe", lower: "spe" }
    ];
  }
  /**
   * Get nature by name
   */
  static getNatureByName(natureName) {
    const nature = this.getAllNatures().find((n) => n.name.toLowerCase() === natureName.toLowerCase());
    if (!nature) {
      throw new Error(`Nature not found: ${natureName}`);
    }
    return nature;
  }
  /**
   * Get move definition from moves database (checks custom first)
   * Optimized with cached lowercase lookups
   */
  static getMoveDefinition(moveName) {
    if (!moveName) return null;
    const cleanName = moveName.replace(/\*+$/, "");
    const lowerName = cleanName.toLowerCase();
    if (customMoves[cleanName]) {
      return customMoves[cleanName];
    }
    const customLower = Object.keys(customMoves).find((key) => key.toLowerCase() === lowerName);
    if (customLower) {
      return customMoves[customLower];
    }
    if (movesDatabase[cleanName]) {
      return movesDatabase[cleanName];
    }
    if (movesMapLower[lowerName]) {
      return movesMapLower[lowerName];
    }
    return null;
  }
  /**
   * Get ability definition from abilities database (checks custom first)
   * Optimized with cached lowercase lookups
   */
  static getAbilityDefinition(abilityName) {
    if (!abilityName) return null;
    const lowerName = abilityName.toLowerCase();
    if (customAbilities[abilityName]) {
      return customAbilities[abilityName];
    }
    const customLower = Object.keys(customAbilities).find((key) => key.toLowerCase() === lowerName);
    if (customLower) {
      return customAbilities[customLower];
    }
    if (abilitiesDatabase[abilityName]) {
      return abilitiesDatabase[abilityName];
    }
    if (abilitiesMapLower[lowerName]) {
      return abilitiesMapLower[lowerName];
    }
    return null;
  }
  /**
   * Get ability learnset entry with full details
   * Handles arrays of ability choices
   */
  static getAbilityLearnsetEntry(abilityOrArray) {
    if (Array.isArray(abilityOrArray)) {
      return abilityOrArray.map((abilityName) => {
        const definition2 = this.getAbilityDefinition(abilityName);
        if (!definition2) {
          return {
            name: abilityName,
            effect: "",
            trigger: "",
            target: "",
            frequency: "Static"
          };
        }
        return this.normalizeAbilityFields(abilityName, definition2);
      });
    }
    const definition = this.getAbilityDefinition(abilityOrArray);
    if (!definition) {
      return {
        name: abilityOrArray,
        effect: "",
        trigger: "",
        target: "",
        frequency: "Static"
      };
    }
    return this.normalizeAbilityFields(abilityOrArray, definition);
  }
  /**
   * Select moves for a Pokemon based on their Level Up moveset only
   * FIXED: Better handling of missing level data
   */
  static selectMovesForPokemon(species, level, count = 6) {
    const allMoves = [];
    const typeField = species["Basic Information"]?.Type || [];
    const extractedTypes = extractPokemonTypes(typeField);
    const pokemonTypes = getActualTypes(extractedTypes);
    if (species.Moves && Array.isArray(species.Moves["Level Up Move List"])) {
      species.Moves["Level Up Move List"].filter((move) => {
        const moveLevel = move.Level !== void 0 ? move.Level : 1;
        return moveLevel <= level && move.Move;
      }).forEach((move) => allMoves.push(move));
    }
    const selected = [];
    if (allMoves.length === 0) {
      const tackleDefinition = this.getMoveDefinition("Tackle") || {};
      return [{
        name: "Tackle",
        ...this.normalizeMoveFields(tackleDefinition, "Tackle", pokemonTypes)
      }];
    }
    const sortedMoves = [...allMoves].sort((a, b) => (b.Level || 0) - (a.Level || 0));
    for (let i = 0; i < Math.min(count, sortedMoves.length); i++) {
      const move = sortedMoves[i];
      const cleanMoveName = move.Move.replace(/\*+$/, "");
      if (!selected.some((m) => m.name === cleanMoveName)) {
        const moveDefinition = this.getMoveDefinition(move.Move);
        if (moveDefinition) {
          const normalizedMove = this.normalizeMoveFields(moveDefinition, cleanMoveName, pokemonTypes);
          selected.push(normalizedMove);
        } else {
          selected.push({ name: cleanMoveName });
        }
      }
    }
    return selected;
  }
  /**
   * Normalize ability object fields to camelCase
   */
  static normalizeAbilityFields(abilityName, definition) {
    return {
      name: abilityName,
      frequency: definition.Frequency,
      trigger: definition.Trigger,
      effect: definition.Effect,
      bonus: definition.Bonus,
      special: definition.Special,
      note: definition.Note
    };
  }
  /**
   * Normalize move object fields to camelCase
   * FIXED: Validate pokemonTypes before calling .some()
   */
  static normalizeMoveFields(moveDefinition, moveName = moveDefinition.Name, pokemonTypes = []) {
    const damageBaseRaw = moveDefinition["Damage Base"];
    const moveType = moveDefinition.Type;
    let hasStab = false;
    if (Array.isArray(pokemonTypes) && pokemonTypes.length > 0) {
      hasStab = pokemonTypes.some(
        (type) => typeof type === "string" && type.toLowerCase() === moveType?.toLowerCase()
      );
    }
    const damageBaseConverted = damageBaseRaw ? convertDamageBase(damageBaseRaw, hasStab) : null;
    return {
      name: moveName || moveDefinition.Name,
      type: moveDefinition.Type,
      frequency: moveDefinition.Frequency,
      class: moveDefinition.Class,
      range: moveDefinition.Range,
      damageBase: damageBaseConverted,
      ac: moveDefinition.AC,
      effect: moveDefinition.Effect
    };
  }
  /**
   * Select an item (currently disabled - returns null)
   */
  static selectItem() {
    return null;
  }
  /**
   * Get species by name from database (checks custom first, then database)
   * Accepts both formats: "Species" or "Species (Form)" or "species|form"
   */
  static getSpeciesByName(name) {
    if (!name) return null;
    const customLower = name.toLowerCase().trim();
    if (customLower.includes("(") && customLower.includes(")")) {
      const match2 = customLower.match(/^([^(]+)\s*\(([^)]+)\)$/);
      if (match2) {
        const baseName = match2[1].trim();
        const formName = match2[2].trim();
        const customSpecies2 = customPokemon.find(
          (p) => p.Species.toLowerCase() === baseName && p.Form && p.Form.toLowerCase() === formName
        );
        if (customSpecies2) {
          return customSpecies2;
        }
        const key = `${baseName}|${formName}`.toLowerCase();
        if (pokemonByName[key]) {
          return pokemonByName[key];
        }
        const baseSpecies = customPokemon.find((p) => p.Species.toLowerCase() === baseName);
        if (baseSpecies) {
          return baseSpecies;
        }
        return pokemonByName[baseName];
      }
    }
    if (customLower.includes("|")) {
      const [baseName, formName] = customLower.split("|").map((s) => s.trim());
      const customSpecies2 = customPokemon.find(
        (p) => p.Species.toLowerCase() === baseName && p.Form && p.Form.toLowerCase() === formName
      );
      if (customSpecies2) {
        return customSpecies2;
      }
      if (pokemonByName[customLower]) {
        return pokemonByName[customLower];
      }
      const baseSpecies = customPokemon.find((p) => p.Species.toLowerCase() === baseName);
      if (baseSpecies) {
        return baseSpecies;
      }
      return pokemonByName[baseName];
    }
    const customSpecies = customPokemon.find((p) => p.Species.toLowerCase() === customLower);
    if (customSpecies) {
      return customSpecies;
    }
    return pokemonByName[customLower];
  }
  /**
   * Get all form variants of a species
   * Returns array of species including base form and all form variants
   * OPTIMIZED: Uses Set to avoid duplicate checking
   */
  static getAllFormsOfSpecies(baseName) {
    if (!baseName) return [];
    const baseLower = baseName.toLowerCase();
    const forms = [];
    const seen = /* @__PURE__ */ new Set();
    customPokemon.forEach((p) => {
      if (p.Species.toLowerCase() === baseLower) {
        const key = `${p.Species}|${p.Form || ""}`;
        if (!seen.has(key)) {
          forms.push(p);
          seen.add(key);
        }
      }
    });
    pokemonDatabase.forEach((p) => {
      if (p.Species.toLowerCase() === baseLower) {
        const key = `${p.Species}|${p.Form || ""}`;
        if (!seen.has(key)) {
          forms.push(p);
          seen.add(key);
        }
      }
    });
    return forms;
  }
  /**
   * Get random species from database (includes custom Pokemon)
   */
  static getRandomSpecies(includeLegendaries = false) {
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    let availablePokemon = allPokemon;
    if (!includeLegendaries) {
      availablePokemon = allPokemon.filter((pokemon) => !pokemon.Legendary);
    }
    if (availablePokemon.length === 0) {
      throw new Error("No Pokemon available with current filters");
    }
    return availablePokemon[Math.floor(Math.random() * availablePokemon.length)];
  }
  /**
   * Get all available habitats
   */
  static getAvailableHabitats() {
    const habitats = /* @__PURE__ */ new Set();
    pokemonDatabase.forEach((pokemon) => {
      const habitatStr = pokemon["Other Information"]?.Habitat;
      if (habitatStr) {
        habitatStr.split(",").forEach((habitat) => {
          habitats.add(habitat.trim());
        });
      }
    });
    return Array.from(habitats).sort();
  }
  /**
   * Get Pokemon by habitat (includes custom Pokemon)
   */
  static getPokemonByHabitat(habitat) {
    if (!habitat) return [];
    const habitatLower = habitat.toLowerCase();
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.filter((pokemon) => {
      const habitatStr = pokemon["Other Information"]?.Habitat || "";
      return habitatStr.toLowerCase().includes(habitatLower);
    });
  }
  /**
   * Get random Pokemon from a specific habitat
   */
  static getRandomSpeciesByHabitat(habitat, includeLegendaries = false) {
    let pokemonInHabitat = this.getPokemonByHabitat(habitat);
    if (!includeLegendaries) {
      pokemonInHabitat = pokemonInHabitat.filter((pokemon) => !pokemon.Legendary);
    }
    if (pokemonInHabitat.length === 0) {
      throw new Error(`No Pokemon found in habitat: ${habitat}`);
    }
    return pokemonInHabitat[Math.floor(Math.random() * pokemonInHabitat.length)];
  }
  /**
   * Get all available types
   */
  static getAvailableTypes() {
    const types = /* @__PURE__ */ new Set();
    pokemonDatabase.forEach((pokemon) => {
      const typeField = pokemon["Basic Information"]?.Type;
      if (typeField) {
        const extractedTypes = extractPokemonTypes(typeField);
        const pokemonTypes = getActualTypes(extractedTypes);
        pokemonTypes.forEach((type) => {
          if (typeof type === "string") {
            types.add(type.trim());
          }
        });
      }
    });
    return Array.from(types).sort();
  }
  /**
   * Get Pokemon by type (includes custom Pokemon)
   */
  static getPokemonByType(type) {
    if (!type) return [];
    const typeLower = type.toLowerCase();
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.filter((pokemon) => {
      const typeField = pokemon["Basic Information"]?.Type;
      if (!typeField) return false;
      const extractedTypes = extractPokemonTypes(typeField);
      const pokemonTypes = getActualTypes(extractedTypes);
      return pokemonTypes.some(
        (t) => typeof t === "string" && t.toLowerCase() === typeLower
      );
    });
  }
  /**
   * Get random Pokemon from a specific type
   */
  static getRandomSpeciesByType(type, includeLegendaries = false) {
    let pokemonOfType = this.getPokemonByType(type);
    if (!includeLegendaries) {
      pokemonOfType = pokemonOfType.filter((pokemon) => !pokemon.Legendary);
    }
    if (pokemonOfType.length === 0) {
      throw new Error(`No Pokemon found with type: ${type}`);
    }
    return pokemonOfType[Math.floor(Math.random() * pokemonOfType.length)];
  }
  /**
   * Get the base form (stage 1) of a Pokemon's evolution chain
   * @param {Object} pokemon - The Pokemon species (can be any stage)
   * @returns {Object} The base form of the evolution chain
   */
  static getBaseFormOfEvolutionChain(pokemon) {
    const evolutionChain = pokemon.Evolution || [];
    if (evolutionChain.length === 0) {
      return pokemon;
    }
    for (let i = 0; i < evolutionChain.length; i++) {
      const evolution = evolutionChain[i];
      const stage = evolution.Stade || i + 1;
      if (stage === 1) {
        const baseName = evolution.Species;
        if (baseName !== pokemon.Species) {
          return this.getSpeciesByName(baseName);
        }
        return pokemon;
      }
    }
    return pokemon;
  }
  /**
   * Select evolved species based on level and evolution conditions
   * @param {Object} baseSpecies - The Pokemon species (can be any stage in evolution chain)
   * @param {number} level - The level of the Pokemon
   * @returns {Object} The evolved species if applicable, otherwise the input species
   */
  static selectEvolvedSpecies(baseSpecies, level) {
    const evolutionChain = baseSpecies.Evolution || [];
    if (evolutionChain.length === 0) {
      return baseSpecies;
    }
    const currentSpeciesName = baseSpecies.Species;
    let currentStage = 1;
    for (let i = 0; i < evolutionChain.length; i++) {
      if (evolutionChain[i].Species === currentSpeciesName) {
        currentStage = evolutionChain[i].Stade || i + 1;
        break;
      }
    }
    let selectedSpeciesName = currentSpeciesName;
    for (let i = evolutionChain.length - 1; i >= 0; i--) {
      const evolution = evolutionChain[i];
      const evolutionStage = evolution.Stade || i + 1;
      if (evolutionStage < currentStage) {
        continue;
      }
      const minLevel = evolution["Minimum Level"];
      if (!minLevel || level >= minLevel) {
        selectedSpeciesName = evolution.Species;
        break;
      }
    }
    if (selectedSpeciesName === currentSpeciesName) {
      return baseSpecies;
    }
    return this.getSpeciesByName(selectedSpeciesName);
  }
  /**
   * List available Pokemon (includes custom Pokemon)
   */
  static async listAvailablePokemon(dataset = "core", fandex = []) {
    const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
    if (dataset !== currentDataset || fandexArray.length !== currentFandexes.length || !fandexArray.every((f) => currentFandexes.includes(f))) {
      await switchDataset(dataset, fandexArray);
    }
    const allPokemon = [...customPokemon, ...pokemonDatabase];
    return allPokemon.map((species) => {
      const displayName = species.Form ? `${species.Species} (${species.Form})` : species.Species;
      return {
        id: species.Number,
        name: displayName,
        baseName: species.Species,
        form: species.Form || null,
        types: species["Basic Information"]?.Type,
        abilities: {
          basic1: species["Basic Information"]?.["Basic Ability 1"],
          basic2: species["Basic Information"]?.["Basic Ability 2"],
          adv1: species["Basic Information"]?.["Adv Ability 1"],
          adv2: species["Basic Information"]?.["Adv Ability 2"],
          high: species["Basic Information"]?.["High Ability"]
        }
      };
    });
  }
  /**
   * Get list of available datasets
   */
  static getAvailableDatasets() {
    return Object.keys(DATASETS).map((key) => ({
      key,
      name: DATASETS[key].name
    }));
  }
  /**
   * Get all available FanDexes
   */
  static getAvailableFandexes() {
    return Object.keys(FANDEX_DATASETS).map((key) => ({
      key,
      name: FANDEX_DATASETS[key].name
    }));
  }
  /**
   * Get current dataset
   */
  static getCurrentDataset() {
    return currentDataset;
  }
  /**
   * Get current FanDexes
   */
  static getCurrentFandexes() {
    return currentFandexes;
  }
  /**
   * Switch to a different dataset
   */
  static async switchDataset(datasetKey, fandexKeys = []) {
    return switchDataset(datasetKey, fandexKeys);
  }
  /**
   * Get available moves for a Pokemon species
   * Returns moves organized by category (levelUp, tm, tutor)
   */
  static async getAvailableMovesForSpecies(speciesName, dataset = "core", fandex = []) {
    try {
      const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
      if (dataset !== currentDataset || fandexArray.length !== currentFandexes.length || !fandexArray.every((f) => currentFandexes.includes(f))) {
        await switchDataset(dataset, fandexArray);
      }
      const species = this.getSpeciesByName(speciesName);
      if (!species) {
        throw new Error(`Pokemon species not found: ${speciesName}`);
      }
      const pokemonTypes = species["Basic Information"]?.Type || [];
      const result = {
        levelUp: [],
        tm: [],
        tutor: []
      };
      if (species.Moves) {
        const movesData = species.Moves;
        if (typeof movesData["Level Up Move List"] === "string") {
          const levelUpStr = movesData["Level Up Move List"]?.trim() || "";
          const tmStr = movesData["TM/Tutor Moves List"]?.trim() || "";
        } else {
          if (Array.isArray(movesData["Level Up Move List"])) {
            result.levelUp = movesData["Level Up Move List"].map((move) => {
              const cleanMoveName = move.Move.replace(/\*+$/, "");
              const hasStab = pokemonTypes.some((type) => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.["Type"] || move.Type,
                level: move.Level,
                frequency: moveDef?.["Frequency"] || "N/A",
                class: moveDef?.["Class"] || "N/A",
                range: moveDef?.["Range"] || "N/A",
                damageBase: moveDef ? convertDamageBase(moveDef["Damage Base"], hasStab) : null,
                ac: moveDef?.["AC"] || moveDef?.["Accuracy"],
                effect: moveDef?.["Effect"]
              };
            });
          }
          if (Array.isArray(movesData["TM/HM Move List"])) {
            result.tm = movesData["TM/HM Move List"].map((move) => {
              const cleanMoveName = move.Move.replace(/\*+$/, "");
              const hasStab = pokemonTypes.some((type) => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.["Type"] || move.Type,
                frequency: moveDef?.["Frequency"] || "N/A",
                class: moveDef?.["Class"] || "N/A",
                range: moveDef?.["Range"] || "N/A",
                damageBase: moveDef ? convertDamageBase(moveDef["Damage Base"], hasStab) : null,
                ac: moveDef?.["AC"] || moveDef?.["Accuracy"],
                effect: moveDef?.["Effect"]
              };
            });
          }
          if (Array.isArray(movesData["Tutor Move List"])) {
            result.tutor = movesData["Tutor Move List"].map((move) => {
              const cleanMoveName = move.Move.replace(/\*+$/, "");
              const hasStab = pokemonTypes.some((type) => type.toLowerCase() === move.Type?.toLowerCase());
              const moveDef = this.getMoveDefinition(cleanMoveName);
              return {
                name: cleanMoveName,
                type: moveDef?.["Type"] || move.Type,
                frequency: moveDef?.["Frequency"] || "N/A",
                class: moveDef?.["Class"] || "N/A",
                range: moveDef?.["Range"] || "N/A",
                damageBase: moveDef ? convertDamageBase(moveDef["Damage Base"], hasStab) : null,
                ac: moveDef?.["AC"] || moveDef?.["Accuracy"],
                effect: moveDef?.["Effect"]
              };
            });
          }
        }
      }
      result.levelUp.sort((a, b) => (a.level || 0) - (b.level || 0));
      return result;
    } catch (error) {
      console.error(`Error getting moves for ${speciesName}:`, error);
      throw error;
    }
  }
  /**
   * Get available abilities for a Pokemon species
   * Returns abilities organized by category (basic, advanced, high)
   */
  static async getAvailableAbilitiesForSpecies(speciesName, dataset = "core", fandex = []) {
    try {
      const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
      if (dataset !== currentDataset || fandexArray.length !== currentFandexes.length || !fandexArray.every((f) => currentFandexes.includes(f))) {
        await switchDataset(dataset, fandexArray);
      }
      const species = this.getSpeciesByName(speciesName);
      if (!species) {
        throw new Error(`Pokemon species not found: ${speciesName}`);
      }
      const flattenAbility = /* @__PURE__ */ __name((ability) => {
        if (Array.isArray(ability)) {
          return ability;
        }
        return [ability];
      }, "flattenAbility");
      const result = {
        basic: [],
        advanced: [],
        high: []
      };
      if (species["Basic Information"]) {
        const basicInfo = species["Basic Information"];
        if (basicInfo["Basic Ability 1"]) {
          flattenAbility(basicInfo["Basic Ability 1"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.basic.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
        if (basicInfo["Basic Ability 2"]) {
          flattenAbility(basicInfo["Basic Ability 2"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.basic.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
        if (basicInfo["Adv Ability 1"]) {
          flattenAbility(basicInfo["Adv Ability 1"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.advanced.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
        if (basicInfo["Adv Ability 2"]) {
          flattenAbility(basicInfo["Adv Ability 2"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.advanced.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
        if (basicInfo["Adv Ability 3"]) {
          flattenAbility(basicInfo["Adv Ability 3"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.advanced.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
        if (basicInfo["High Ability"]) {
          flattenAbility(basicInfo["High Ability"]).forEach((abilityName) => {
            const abilityData = abilitiesDatabase[abilityName];
            result.high.push({
              name: abilityName,
              frequency: abilityData?.Frequency || "N/A",
              effect: abilityData?.Effect || "N/A"
            });
          });
        }
      }
      return result;
    } catch (error) {
      console.error(`Error getting abilities for ${speciesName}:`, error);
      throw error;
    }
  }
  static async getAllMovesFromDatabase(dataset = "core", fandex = []) {
    try {
      const movesUrl = DATASETS_BASE_URL + DATASETS[dataset].moves;
      let movesDatabase2 = await fetchDataFromURL(movesUrl);
      const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
      for (const fandexKey of fandexArray) {
        if (FANDEX_DATASETS[fandexKey]) {
          const fandexMovesUrl = DATASETS_BASE_URL + FANDEX_DATASETS[fandexKey].moves;
          const fandexMoves = await fetchDataFromURL(fandexMovesUrl);
          movesDatabase2 = { ...movesDatabase2, ...fandexMoves };
        }
      }
      const result = {
        all: []
      };
      for (const [moveName, moveData] of Object.entries(movesDatabase2)) {
        result.all.push({
          name: moveName,
          type: moveData["Type"] || "N/A",
          frequency: moveData["Frequency"] || "N/A",
          class: moveData["Class"] || "N/A",
          range: moveData["Range"] || "N/A",
          damageBase: convertDamageBase(moveData["Damage Base"]) || null,
          ac: moveData["Accuracy"],
          effect: moveData["Effect"] || "N/A"
        });
      }
      result.all.sort((a, b) => a.name.localeCompare(b.name));
      return result;
    } catch (error) {
      console.error(`Error getting all moves from database:`, error);
      throw error;
    }
  }
  static async getAllAbilitiesFromDatabase(dataset = "core", fandex = []) {
    try {
      const abilitiesUrl = DATASETS_BASE_URL + DATASETS[dataset].abilities;
      let abilitiesData = await fetchDataFromURL(abilitiesUrl);
      const fandexArray = Array.isArray(fandex) ? fandex : typeof fandex === "string" ? fandex.split(",").filter(Boolean) : [];
      for (const fandexKey of fandexArray) {
        if (FANDEX_DATASETS[fandexKey]) {
          const fandexAbilitiesUrl = DATASETS_BASE_URL + FANDEX_DATASETS[fandexKey].abilities;
          let fandexAbilities = await fetchDataFromURL(fandexAbilitiesUrl);
          if (Array.isArray(fandexAbilities)) {
            const fandexAbilitiesObj = {};
            fandexAbilities.forEach((ability) => {
              if (ability.Name) {
                fandexAbilitiesObj[ability.Name] = ability;
              }
            });
            if (Array.isArray(abilitiesData)) {
              const existingNames = new Set(abilitiesData.map((a) => a.Name));
              abilitiesData = [
                ...abilitiesData,
                ...Object.values(fandexAbilitiesObj).filter((a) => !existingNames.has(a.Name))
              ];
            } else {
              abilitiesData = { ...abilitiesData, ...fandexAbilitiesObj };
            }
          } else {
            if (Array.isArray(abilitiesData)) {
              const baseObj = {};
              abilitiesData.forEach((ability) => {
                if (ability.Name) {
                  baseObj[ability.Name] = ability;
                }
              });
              const mergedObj = { ...baseObj, ...fandexAbilities };
              abilitiesData = Object.values(mergedObj);
            } else {
              abilitiesData = { ...abilitiesData, ...fandexAbilities };
            }
          }
        }
      }
      let abilitiesList = [];
      if (Array.isArray(abilitiesData)) {
        abilitiesList = abilitiesData;
      } else {
        abilitiesList = Object.entries(abilitiesData).filter(([key]) => isNaN(parseInt(key))).map(([name, data]) => ({
          Name: name,
          Frequency: data["Frequency"] || "N/A",
          Effect: data["Effect"] || "N/A"
        }));
      }
      const result = {
        all: abilitiesList.map((ability) => ({
          name: ability.Name || ability.name,
          frequency: ability.Frequency || ability.frequency || "N/A",
          effect: ability.Effect || ability.effect || "N/A"
        }))
      };
      result.all.sort((a, b) => a.name.localeCompare(b.name));
      return result;
    } catch (error) {
      console.error(`Error getting all abilities from database:`, error);
      throw error;
    }
  }
  /**
   * Load custom Pokemon from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomPokemon(data) {
    try {
      let pokemonData;
      if (typeof data === "string") {
        pokemonData = await fetchDataFromURL(data);
      } else {
        pokemonData = data;
      }
      if (!Array.isArray(pokemonData)) {
        throw new Error("Custom Pokemon data must be an array");
      }
      if (pokemonData.length > 1e3) {
        console.warn(`Custom Pokemon data too large (${pokemonData.length}). Truncating to 1000.`);
        pokemonData = pokemonData.slice(0, 1e3);
      }
      const validPokemon = pokemonData.filter((pokemon) => {
        if (!pokemon.Species || typeof pokemon.Species !== "string") {
          console.warn("Skipping Pokemon without valid Species field");
          return false;
        }
        return true;
      });
      const customMap = new Map(customPokemon.map((p) => [p.Species.toLowerCase(), p]));
      validPokemon.forEach((pokemon) => {
        customMap.set(pokemon.Species.toLowerCase(), pokemon);
      });
      customPokemon = Array.from(customMap.values());
      validPokemon.forEach((pokemon) => {
        pokemonByName[pokemon.Species.toLowerCase()] = pokemon;
      });
      console.log(`\u2713 Loaded ${validPokemon.length} custom Pokemon (${customPokemon.length} total)`);
      return {
        success: true,
        count: validPokemon.length,
        totalCustom: customPokemon.length
      };
    } catch (error) {
      console.error("Error loading custom Pokemon:", error);
      throw error;
    }
  }
  /**
   * Load custom Abilities from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomAbilities(data) {
    try {
      let abilitiesData;
      if (typeof data === "string") {
        abilitiesData = await fetchDataFromURL(data);
      } else {
        abilitiesData = data;
      }
      let count = 0;
      if (Array.isArray(abilitiesData)) {
        const slice = abilitiesData.slice(0, 500);
        count = slice.length;
        slice.forEach((ability) => {
          if (ability.Name && typeof ability.Name === "string") {
            customAbilities[ability.Name] = ability;
          }
        });
      } else {
        const entries = Object.entries(abilitiesData).slice(0, 500);
        count = entries.length;
        entries.forEach(([name, abilityData]) => {
          if (typeof name === "string" && abilityData) {
            customAbilities[name] = abilityData;
          }
        });
      }
      Object.keys(customAbilities).forEach((abilityName) => {
        abilitiesMapLower[abilityName.toLowerCase()] = customAbilities[abilityName];
      });
      console.log(`\u2713 Loaded ${count} custom Abilities (${Object.keys(customAbilities).length} total)`);
      return {
        success: true,
        count,
        totalCustom: Object.keys(customAbilities).length
      };
    } catch (error) {
      console.error("Error loading custom Abilities:", error);
      throw error;
    }
  }
  /**
   * Load custom Moves from JSON data or URL
   * @param {Object|string} data - Either parsed JSON object or URL string
   * @returns {Promise<Object>} Result with count and status
   */
  static async loadCustomMoves(data) {
    try {
      let movesData;
      if (typeof data === "string") {
        movesData = await fetchDataFromURL(data);
      } else {
        movesData = data;
      }
      let count = 0;
      if (Array.isArray(movesData)) {
        const slice = movesData.slice(0, 500);
        count = slice.length;
        slice.forEach((move) => {
          if (move.Name && typeof move.Name === "string") {
            customMoves[move.Name] = move;
          }
        });
      } else {
        const entries = Object.entries(movesData).slice(0, 500);
        count = entries.length;
        entries.forEach(([name, moveData]) => {
          if (typeof name === "string" && moveData) {
            customMoves[name] = moveData;
          }
        });
      }
      Object.keys(customMoves).forEach((moveName) => {
        movesMapLower[moveName.toLowerCase()] = customMoves[moveName];
      });
      console.log(`\u2713 Loaded ${count} custom Moves (${Object.keys(customMoves).length} total)`);
      return {
        success: true,
        count,
        totalCustom: Object.keys(customMoves).length
      };
    } catch (error) {
      console.error("Error loading custom Moves:", error);
      throw error;
    }
  }
  /**
   * Get custom data that has been loaded
   */
  static getCustomData() {
    return {
      pokemon: customPokemon.length,
      abilities: Object.keys(customAbilities).length,
      moves: Object.keys(customMoves).length
    };
  }
  /**
   * Clear all custom data
   */
  static clearCustomData() {
    customPokemon.forEach((pokemon) => {
      delete pokemonByName[pokemon.Species.toLowerCase()];
    });
    customPokemon = [];
    customAbilities = {};
    customMoves = {};
    console.log("\u2713 Cleared all custom data");
    return { success: true };
  }
};
var pokemonGenerator_default = PokemonGenerator;

// src/worker.js
var app = new Hono2();
app.use("/api/*", cors());
var initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await initializeDatasets();
    initialized = true;
  }
}
__name(ensureInitialized, "ensureInitialized");
function normalizeQuery(query) {
  const normalized = {};
  for (const [key, value] of Object.entries(query)) {
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}
__name(normalizeQuery, "normalizeQuery");
function splitFandex(query) {
  return query.fandex ? query.fandex.split(",") : [];
}
__name(splitFandex, "splitFandex");
async function loadCustomDataFromQuery(query) {
  const customLoaders = [
    {
      url: query.custompokemonurl,
      label: "custom Pokemon",
      load: pokemonGenerator_default.loadCustomPokemon
    },
    {
      url: query.customabilitiesurl,
      label: "custom Abilities",
      load: pokemonGenerator_default.loadCustomAbilities
    },
    {
      url: query.custommovesurl,
      label: "custom Moves",
      load: pokemonGenerator_default.loadCustomMoves
    }
  ];
  for (const customLoader of customLoaders) {
    if (!customLoader.url) continue;
    try {
      await customLoader.load.call(pokemonGenerator_default, customLoader.url);
    } catch (error) {
      console.warn(`Failed to load ${customLoader.label} from URL:`, error.message);
    }
  }
}
__name(loadCustomDataFromQuery, "loadCustomDataFromQuery");
async function readJsonBody(c) {
  try {
    return await c.req.json();
  } catch {
    return {};
  }
}
__name(readJsonBody, "readJsonBody");
function jsonError(c, error, status = 500) {
  return c.json({ error: error.message }, status);
}
__name(jsonError, "jsonError");
app.get("/health", (c) => {
  return c.json({ status: "OK", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
app.get("/api/info", (c) => {
  return c.json({
    name: "PTU 1.05 Pokemon Generator API",
    version: "1.1.0",
    endpoints: {
      health: "/health",
      generate: "/api/pokemon/generate",
      generateWild: "/api/pokemon/generateWild/:level",
      team: "/api/pokemon/team",
      list: "/api/pokemon/list",
      datasets: "/api/pokemon/datasets",
      natures: "/api/pokemon/natures",
      types: "/api/pokemon/types",
      habitats: "/api/pokemon/habitats",
      moves: "/api/pokemon/moves/:species",
      abilities: "/api/pokemon/abilities/:species",
      allMoves: "/api/pokemon/all-moves",
      allAbilities: "/api/pokemon/all-abilities",
      customPokemon: "POST /api/pokemon/custom/pokemon",
      customAbilities: "POST /api/pokemon/custom/abilities",
      customMoves: "POST /api/pokemon/custom/moves",
      customStatus: "GET /api/pokemon/custom",
      customClear: "DELETE /api/pokemon/custom"
    },
    documentation: "See README.md and CUSTOMIZATION.md for full documentation"
  });
});
app.get("/api/pokemon/generate", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);
    const pokemon = await pokemonGenerator_default.generatePokemon({
      level: query.level ? parseInt(query.level) : void 0,
      minlevel: query.minlevel ? parseInt(query.minlevel) : void 0,
      maxlevel: query.maxlevel ? parseInt(query.maxlevel) : void 0,
      species: query.species,
      type: query.type,
      habitat: query.habitat,
      randomform: query.randomform === "true",
      shiny: query.shiny === "true",
      shinyodds: query.shinyodds ? parseFloat(query.shinyodds) : void 0,
      distribution: (query.distribution || "RANDOM").toUpperCase(),
      ignorebaserelation: query.ignorebaserelation?.toUpperCase(),
      hpformula: query.hpformula,
      dataset: (query.dataset || "core").toLowerCase(),
      nature: query.nature,
      includelegendaries: query.includelegendaries,
      forceevolution: query.forceevolution,
      fandex: splitFandex(query)
    });
    return c.json(pokemon);
  } catch (error) {
    console.error("Error generating pokemon:", error);
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/generateWild/:level", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);
    const level = parseInt(c.req.param("level"));
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    if (isNaN(level) || level < 1 || level > 100) {
      return c.json({ error: "Level must be between 1 and 100" }, 400);
    }
    const pokemon = await pokemonGenerator_default.generatePokemon({ level, dataset, fandex });
    return c.json(pokemon);
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/team", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    await loadCustomDataFromQuery(query);
    let level;
    if (query.minlevel !== void 0 && query.maxlevel !== void 0) {
      const min = Math.max(1, parseInt(query.minlevel));
      const max = Math.min(100, parseInt(query.maxlevel));
      level = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (query.level) {
      level = parseInt(query.level);
    } else {
      level = 50;
    }
    let size;
    if (query.minsize !== void 0 && query.maxsize !== void 0) {
      const min = Math.max(1, parseInt(query.minsize));
      const max = Math.min(50, parseInt(query.maxsize));
      size = Math.floor(Math.random() * (max - min + 1)) + min;
    } else if (query.size) {
      size = Math.min(parseInt(query.size), 50);
    } else {
      size = 6;
    }
    const options = {
      level,
      size,
      dataset: (query.dataset || "core").toLowerCase(),
      fandex: splitFandex(query),
      includelegendaries: query.includelegendaries
    };
    if (options.level < 1 || options.level > 100) {
      return c.json({ error: "Level must be between 1 and 100" }, 400);
    }
    const team = await pokemonGenerator_default.generateTeam(options);
    return c.json(team);
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/list", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    const pokemon = await pokemonGenerator_default.listAvailablePokemon(dataset, fandex);
    const speciesNames = pokemon.map((p) => p.name);
    return c.json({
      count: speciesNames.length,
      dataset,
      fandex,
      species: speciesNames
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/datasets", async (c) => {
  try {
    await ensureInitialized();
    const datasets = pokemonGenerator_default.getAvailableDatasets();
    return c.json({
      current: pokemonGenerator_default.getCurrentDataset(),
      datasets
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/fandexes", async (c) => {
  try {
    await ensureInitialized();
    const fandexes = pokemonGenerator_default.getAvailableFandexes();
    return c.json({
      current: pokemonGenerator_default.getCurrentFandexes(),
      fandexes
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/habitats", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    await pokemonGenerator_default.listAvailablePokemon(dataset, fandex);
    const habitats = pokemonGenerator_default.getAvailableHabitats();
    return c.json({
      habitats,
      count: habitats.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/types", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    await pokemonGenerator_default.listAvailablePokemon(dataset, fandex);
    const types = pokemonGenerator_default.getAvailableTypes();
    return c.json({
      types,
      count: types.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/habitat/:habitatName", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const habitat = c.req.param("habitatName");
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    await pokemonGenerator_default.listAvailablePokemon(dataset, fandex);
    const pokemonList = pokemonGenerator_default.getPokemonByHabitat(habitat);
    if (pokemonList.length === 0) {
      return c.json({ error: `No Pokemon found in habitat: ${habitat}` }, 400);
    }
    return c.json({
      habitat,
      species: pokemonList.map((p) => ({
        name: p.Species,
        id: p.Number,
        types: p["Basic Information"]?.Type || []
      })),
      count: pokemonList.length,
      dataset,
      fandex
    });
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/natures", async (c) => {
  try {
    await ensureInitialized();
    const natures = pokemonGenerator_default.getAllNatures();
    return c.json({
      count: natures.length,
      natures
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.get("/api/pokemon/moves/:species", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = c.req.param("species");
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    const moves = await pokemonGenerator_default.getAvailableMovesForSpecies(species, dataset, fandex);
    return c.json(moves);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/abilities/:species", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = c.req.param("species");
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    const abilities = await pokemonGenerator_default.getAvailableAbilitiesForSpecies(species, dataset, fandex);
    return c.json(abilities);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/all-moves", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    const moves = await pokemonGenerator_default.getAllMovesFromDatabase(dataset, fandex);
    return c.json(moves);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/all-abilities", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const dataset = (query.dataset || "core").toLowerCase();
    const fandex = splitFandex(query);
    const abilities = await pokemonGenerator_default.getAllAbilitiesFromDatabase(dataset, fandex);
    return c.json(abilities);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.post("/api/pokemon/custom/pokemon", async (c) => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);
    if (!data && !url) {
      return c.json({ error: "Must provide either data (JSON) or url (string)" }, 400);
    }
    const result = await pokemonGenerator_default.loadCustomPokemon(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.post("/api/pokemon/custom/abilities", async (c) => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);
    if (!data && !url) {
      return c.json({ error: "Must provide either data (JSON) or url (string)" }, 400);
    }
    const result = await pokemonGenerator_default.loadCustomAbilities(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.post("/api/pokemon/custom/moves", async (c) => {
  try {
    await ensureInitialized();
    const { data, url } = await readJsonBody(c);
    if (!data && !url) {
      return c.json({ error: "Must provide either data (JSON) or url (string)" }, 400);
    }
    const result = await pokemonGenerator_default.loadCustomMoves(data || url);
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/custom", async (c) => {
  try {
    await ensureInitialized();
    const customData = pokemonGenerator_default.getCustomData();
    return c.json({ custom: customData });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.delete("/api/pokemon/custom", async (c) => {
  try {
    await ensureInitialized();
    const result = pokemonGenerator_default.clearCustomData();
    return c.json(result);
  } catch (error) {
    return jsonError(c, error, 400);
  }
});
app.get("/api/pokemon/evolutions/:species", async (c) => {
  try {
    await ensureInitialized();
    const query = normalizeQuery(c.req.query());
    const species = decodeURIComponent(c.req.param("species"));
    const dataset = query.dataset || "core";
    if (dataset !== pokemonGenerator_default.getCurrentDataset()) {
      await pokemonGenerator_default.switchDataset(dataset);
    }
    const pokemon = pokemonGenerator_default.getSpeciesByName(species);
    if (!pokemon) {
      return c.json({ error: `Pokemon "${species}" not found in dataset "${dataset}"` }, 404);
    }
    const evolutionData = pokemon.Evolution || [];
    if (evolutionData.length === 0) {
      return c.json({ evolutionChain: [{ stage: 1, species: pokemon.Species, minimumLevel: 1 }] });
    }
    let currentStage = 1;
    let maxStage = 1;
    evolutionData.forEach((evo) => {
      const stage = evo.Stade || 1;
      if (evo.Species?.toLowerCase() === species.toLowerCase()) {
        currentStage = stage;
      }
      maxStage = Math.max(maxStage, stage);
    });
    return c.json({
      evolutionChain: evolutionData,
      currentSpecies: pokemon.Species,
      currentStage,
      maxStage,
      evolutionsRemaining: maxStage - currentStage
    });
  } catch (error) {
    return jsonError(c, error, 500);
  }
});
app.all("*", (c) => c.env.ASSETS.fetch(c.req.raw));
var worker_default = app;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError2 = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError2;

// .wrangler/tmp/bundle-Mmv6jS/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-Mmv6jS/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
