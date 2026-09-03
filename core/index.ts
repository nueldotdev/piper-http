import type { PiperRoutes, PiperOptions, PiperRequest, PiperResponse } from "../utils/types.js";

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
    let urlTemplate: string;
    this.routes[routeKey] ? urlTemplate = this.routes[routeKey] : urlTemplate = routeKey;
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

    return createPiperRequest(fetchFn);
  }

  post(
    routeKey: string,
    body: Record<string, any>,
    params?: Record<string, any>
  ) {
    let urlTemplate: string;
    this.routes[routeKey] ? urlTemplate = this.routes[routeKey] : urlTemplate = routeKey;
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

    return createPiperRequest(fetchFn);
  }

  private interpolate(template: string, params: Record<string, any> = {}) {
    return template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      return params[key] ?? `:${key}`;
    });
  }
}



function createPiperRequest<T>(fetchFn: () => Promise<T>): PiperRequest<T> {
  let lastValue: any;
  let onResponse: ((response: T) => any) | undefined;
  let onError: ((error: any) => any) | undefined;

  const run = async (): Promise<T> => {
    try {
      const response = await fetchFn();
      lastValue = onResponse ? onResponse(response) : response;
      return lastValue;
    } catch (error) {
      if (!onError) throw error;
      lastValue = onError(error);
      return lastValue;
    }
  };

  const request = (() => run()) as PiperRequest<T>;
  request.run = run;
  request.new = run;
  request.on = (callback) => {
    onResponse = callback;
    return request;
  };
  request.fail = (callback) => {
    onError = callback;
    return request;
  };
  request.value = () => lastValue;
  request.then = (onfulfilled, onrejected) => run().then(onfulfilled, onrejected);

  return request;
}

export type { PiperRequest };
