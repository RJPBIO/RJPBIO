/* Sentry — server. */
if (process.env.SENTRY_DSN) {
  const Sentry = require("@sentry/nextjs");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request?.headers) delete event.request.headers.authorization;
      return event;
    },
  });
}
