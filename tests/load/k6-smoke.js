/* k6 smoke — API + home under steady 50 VU for 1 min. */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    home: { executor: "constant-vus", vus: 20, duration: "1m", exec: "home" },
    api:  { executor: "constant-vus", vus: 10, duration: "1m", exec: "api", startTime: "5s" },
  },
  thresholds: {
    http_req_failed:  ["rate<0.01"],
    http_req_duration: ["p(95)<400", "p(99)<800"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:3000";

export function home() {
  const r = http.get(`${BASE}/`);
  check(r, { "200": (x) => x.status === 200 });
  sleep(1);
}

export function api() {
  const r = http.get(`${BASE}/api/health`);
  check(r, { "health ok": (x) => x.status === 200 });
  sleep(1);
}
