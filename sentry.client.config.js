/* Sentry — browser. Loads only if NEXT_PUBLIC_SENTRY_DSN is set. */
if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0.1,
      beforeSend(event) {
        if (event.request?.cookies) delete event.request.cookies;
        if (event.user) delete event.user.email;
        return event;
      },
    });
    window.Sentry = Sentry;
  }).catch(() => {});
}
