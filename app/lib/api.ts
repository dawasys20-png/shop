type ApiRequestInit = RequestInit;

const authEndpoints = new Set([
  "/auth/signup",
  "/auth/login",
  "/auth/admin/login",
  "/auth/refresh",
  "/auth/logout",
]);

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");
  if (typeof window === "undefined") return "http://localhost:4000/api";
  return `${window.location.protocol}//${window.location.hostname}:4000/api`;
}

function getRequestUrl(path: string) {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

function shouldAttemptRefresh(path: string, response: Response) {
  return response.status === 401 && !authEndpoints.has(path.split(/[?#]/, 1)[0]);
}

async function refreshSession() {
  return fetch(getRequestUrl("/auth/refresh"), {
    method: "POST",
    credentials: "include",
  });
}

function redirectToLogin() {
  if (typeof window === "undefined") return;

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (
    window.location.pathname === "/login" ||
    window.location.pathname === "/signup" ||
    window.location.pathname === "/admin/login"
  ) {
    return;
  }

  const loginPath = window.location.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";
  const params = new URLSearchParams({ session: "expired", returnTo: currentPath });
  window.location.replace(`${loginPath}?${params.toString()}`);
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;
  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(body: unknown) {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = body.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (typeof body === "string" && body.trim()) return body;
  return "The request could not be completed.";
}

export async function apiRequest<T>(
  path: string,
  init: ApiRequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    init.body !== undefined &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const request = () =>
    fetch(getRequestUrl(path), {
      ...init,
      headers,
      credentials: "include",
    });

  let response = await request();
  if (shouldAttemptRefresh(path, response)) {
    let refreshResponse: Response;
    try {
      refreshResponse = await refreshSession();
    } catch (error) {
      redirectToLogin();
      throw error;
    }
    if (refreshResponse.ok) {
      response = await request();
      if (response.status === 401) redirectToLogin();
    } else {
      redirectToLogin();
    }
  }

  const body = await readResponseBody(response);
  if (!response.ok) throw new Error(getErrorMessage(body));
  return body as T;
}
