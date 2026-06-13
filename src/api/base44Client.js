const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://learnorbit-api.onrender.com/api";
const TOKEN_KEY = "learnorbit_access_token";

const ENTITY_ROUTES = {
  User: "users",
  Course: "courses",
  CourseTopic: "course-topics",
  Enrollment: "enrollments",
  UserProgress: "user-progress",
};

function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    window.localStorage.setItem(TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

function createEntityClient(route) {
  return {
    async list(order, limit) {
      return request(
        `/entities/${route}${buildQuery({
          order,
          limit,
        })}`,
      );
    },
    async filter(filters = {}) {
      return request(`/entities/${route}${buildQuery(filters)}`);
    },
    async create(payload) {
      return request(`/entities/${route}`, {
        method: "POST",
        body: payload,
      });
    },
    async update(id, payload) {
      return request(`/entities/${route}/${id}`, {
        method: "PATCH",
        body: payload,
      });
    },
    async delete(id) {
      return request(`/entities/${route}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

const entities = Object.fromEntries(
  Object.entries(ENTITY_ROUTES).map(([name, route]) => [
    name,
    createEntityClient(route),
  ]),
);

export const base44 = {
  auth: {
    async loginViaEmailPassword(email, password) {
      const result = await request("/auth/login", {
        method: "POST",
        body: { email, password },
        auth: false,
      });
      setToken(result.access_token);
      return result;
    },
    async register(payload) {
      const result = await request("/auth/register", {
        method: "POST",
        body: payload,
        auth: false,
      });
      if (result?.access_token) {
        setToken(result.access_token);
      }
      return result;
    },
    async me() {
      return request("/auth/me");
    },
    async resetPasswordRequest(email) {
      return request("/auth/reset-password-request", {
        method: "POST",
        body: { email },
        auth: false,
      });
    },
    async resetPassword({ resetToken, newPassword }) {
      return request("/auth/reset-password", {
        method: "POST",
        body: { resetToken, newPassword },
        auth: false,
      });
    },
    async verifyOtp() {
      throw new Error("OTP verification is not required in the local backend.");
    },
    async resendOtp() {
      throw new Error("OTP verification is not required in the local backend.");
    },
    setToken,
    getToken,
    logout(redirectTo = "/") {
      setToken(null);
      if (redirectTo) {
        window.location.href = redirectTo;
      }
    },
    redirectToLogin(redirectTo = "/") {
      window.location.href = redirectTo;
    },
    async loginWithProvider() {
      throw new Error("Google login is not configured for the local backend.");
    },
  },
  entities,
};
