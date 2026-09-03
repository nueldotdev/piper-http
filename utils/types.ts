type RouteMap = Record<string, string>;
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface PiperResponse {
  status: number;
  data: any;
}

interface PiperRequest<T = PiperResponse> {
  (): Promise<T>;
  ["new"](): Promise<T>;
  run(): Promise<T>;
  on(callback: Callback<T>): PiperRequest<T>;
  fail(callback: (error: any) => any): PiperRequest<T>;
  value(): any;
  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2>;
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