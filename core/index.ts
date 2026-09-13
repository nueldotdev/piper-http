import type { PiperRoutes, PiperOptions, PiperRequest, PiperResponse } from "../utils/types.js";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "QUERY";

/** HTTP client for configured routes and direct URL templates. */
export class Piper {
  private baseURL: string;
  private routes: PiperRoutes;
  private headers: Record<string, string>;

  /**
   * Creates a Piper HTTP client.
   * @param options Client configuration, including the base URL and optional routes and headers.
   */
  constructor(options: PiperOptions) {
    this.baseURL = options.baseURL;
    this.routes = options.routes || {};
    this.headers = options.headers || {};
  }

  /**
   * Sends a GET request.
   * @param routeKey A configured route key or URL template such as `/users/:id`.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  get(routeKey: string, params?: Record<string, any>) {
    return this.request("GET", routeKey, params);
  }

  /**
   * Sends a POST request.
   * @param routeKey A configured route key or URL template.
   * @param body Request body. JSON is serialized when `Content-Type` is `application/json`.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  post(
    routeKey: string,
    body: Record<string, any>,
    params?: Record<string, any>
  ) {
    return this.request("POST", routeKey, params, body);
  }

  /**
   * Sends a PUT request.
   * @param routeKey A configured route key or URL template.
   * @param body Request body. JSON is serialized when `Content-Type` is `application/json`.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  put(
    routeKey: string,
    body: Record<string, any>,
    params?: Record<string, any>
  ) {
    return this.request("PUT", routeKey, params, body);
  }

  /**
   * Sends a PATCH request.
   * @param routeKey A configured route key or URL template.
   * @param body Request body. JSON is serialized when `Content-Type` is `application/json`.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  patch(
    routeKey: string,
    body: Record<string, any>,
    params?: Record<string, any>
  ) {
    return this.request("PATCH", routeKey, params, body);
  }

  /**
   * Sends a DELETE request.
   * @param routeKey A configured route key or URL template.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  delete(routeKey: string, params?: Record<string, any>) {
    return this.request("DELETE", routeKey, params);
  }

  /**
  * Sends a QUERY request with URL query parameters.
   * @param routeKey A configured route key or URL template.
   * @param queryParams Values appended to the URL query string.
   * @param params URL-template values and optional request headers.
   * @returns A thenable request with `run`, `on`, `fail`, and `value` helpers.
   */
  query(routeKey: string, queryParams: Record<string, any>, params?: Record<string, any>) {
    return this.request("QUERY", routeKey, params, undefined, queryParams);
  }

  private request(
    method: HttpMethod,
    routeKey: string,
    params?: Record<string, any>,
    body?: Record<string, any>,
    queryParams?: Record<string, any>
  ) {
    const urlTemplate = this.routes[routeKey] || routeKey;
    if (!urlTemplate) throw new Error(`Route "${routeKey}" not defined`);

    const queryString = queryParams
      ? new URLSearchParams(queryParams).toString()
      : "";
    const url = this.interpolate(urlTemplate, params) + (queryString ? `?${queryString}` : "");
    const fullURL = `${this.baseURL}${url}`;
    const headers = {
      ...this.headers,
      ...(params?.headers || {}),
    };
    const requestInit: RequestInit = { method, headers };

    if (body !== undefined) {
      const isJson = headers["Content-Type"]?.includes("application/json");
      requestInit.body = isJson
        ? JSON.stringify(body)
        : body instanceof FormData || body instanceof URLSearchParams || typeof body === "string"
        ? body
        : new URLSearchParams(body as Record<string, string>);
    }

    return createPiperRequest(async () => {
      const response = await fetch(fullURL, requestInit);
      const data = await response.json();
      if (!response.ok) throw { status: response.status, data };
      return { status: response.status, data } as PiperResponse;
    });
  }

  private interpolate(template: string, params: Record<string, any> = {}) {
    return template.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      return params[key] ?? `:${key}`;
    });
  }
}


/** Creates a repeatable, chainable request wrapper around a fetch operation. */
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
