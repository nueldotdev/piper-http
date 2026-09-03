import { PiperRoutes, PiperOptions, Callback, PiperResponse } from "../utils/types";

export class Piper {
  private baseURL: string;
  private routes: PiperRoutes;
  private headers: Record<string, string>;

  constructor(options: PiperOptions) {
    this.baseURL = options.baseURL;
    this.routes = options.routes || {};
    this.headers = options.headers || {};
  }

  get(routeKey: string, params?: Record<string, any>) {
    const urlTemplate = this.routes[routeKey];
    if (!urlTemplate) throw new Error(`Route "${routeKey}" not defined`);

    const url = this.interpolate(urlTemplate, params);
    const fullURL = `${this.baseURL}${url}`;

    const headers = {
      ...this.headers,
      ...(params?.headers || {}),
    };

    const fetchFn = async () => {
      const res = await fetch(fullURL, { headers });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return { status: res.status, data } as PiperResponse;
    };

    return new PiperRequest<PiperResponse>(fetchFn(), fetchFn);
  }

  post(
    routeKey: string,
    body: Record<string, any>,
    params?: Record<string, any>
  ) {
    const urlTemplate = this.routes[routeKey];
    if (!urlTemplate) throw new Error(`Route "${routeKey}" not defined`);

    const url = this.interpolate(urlTemplate, params);
    const fullURL = `${this.baseURL}${url}`;

    const mergedHeaders = {
      ...this.headers,
      ...(params?.headers || {}),
    };

    const isJson = mergedHeaders["Content-Type"]?.includes("application/json");

    const fetchFn = async () => {
      const res = await fetch(fullURL, {
        method: "POST",
        headers: mergedHeaders,
        body: isJson
          ? JSON.stringify(body)
          : body instanceof FormData || body instanceof URLSearchParams || typeof body === "string"
          ? body
          : new URLSearchParams(body as Record<string, string>),
      });
      const data = await res.json();
      if (!res.ok) throw { status: res.status, data };
      return { status: res.status, data } as PiperResponse;
    };

    return new PiperRequest<PiperResponse>(fetchFn(), fetchFn);
  }

  private interpolate(template: string, params: Record<string, any> = {}) {
    return template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      return params[key] ?? `:${key}`;
    });
  }
}



class PiperRequest<T = PiperResponse> {
  private request: Promise<T>;
  private lastResolved: T | null = null;
  private lastError: any = null;
  private fetchFn: () => Promise<T>;
  private handlers: {
    on?: (response: T) => any;
    fail?: (error: any) => any;
  } = {};
  private _processedValue: any = undefined;

  constructor(fetchPromise: Promise<T>, fetchFn?: () => Promise<T>) {
    this.request = fetchPromise;
    this.fetchFn = fetchFn || (() => fetchPromise);
    this.run();
  }

  private async run() {
    try {
      const result = await this.fetchFn();
      if (result && typeof result === "object") {
        (result as unknown as PiperResponse).new = async () => {
          await this.run();
          return this.lastResolved as PiperResponse;
        };
      }
      this.lastResolved = result;
      if (this.handlers.on) {
        this._processedValue = this.handlers.on(result);
      } else {
        this._processedValue = result;
      }
    } catch (err) {
      this.lastError = err;
      if (this.handlers.fail) {
        this._processedValue = this.handlers.fail(err);
      } else {
        this._processedValue = err;
      }
    }
  }

  on(callback: (response: T) => any) {
    this.handlers.on = callback;
    if (this.lastResolved) {
      this._processedValue = callback(this.lastResolved);
    }
    return this;
  }

  fail(callback: (error: any) => any) {
    this.handlers.fail = callback;
    if (this.lastError) {
      this._processedValue = callback(this.lastError);
    }
    return this;
  }

  async new() {
    await this.run();
    return this;
  }

  value() {
    return this._processedValue;
  }

  then(resolve: (data: any) => void) {
    return this.request.then(resolve);
  }

  catch(reject: (err: any) => void) {
    return this.request.catch(reject);
  }

  toJSON() {
    return this.lastResolved;
  }

  [Symbol.for("nodejs.util.inspect.custom")]() {
    return this.lastResolved;
  }
}
