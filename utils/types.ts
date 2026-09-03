type RouteMap = Record<string, string>;
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface PiperRequest {
  method: Method;
  routeKey: string;
  body?: any;
  params?: Record<string, string>;
}

interface PiperResponse {
  status: number;
  data: any;
  new?: () => Promise<PiperResponse>;
}

type Handler = (data: any) => void;

type PiperRoutes = Record<string, string>;

interface PiperOptions {
  baseURL: string;
  routes?: PiperRoutes;
  headers?: Record<string, string>;
}

type Callback<T> = (data: T) => any;

export { PiperRoutes, Callback, Method, PiperOptions, PiperRequest, PiperResponse, Handler };