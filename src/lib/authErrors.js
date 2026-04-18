/* ═══════════════════════════════════════════════════════════════
   Auth error mapper — traduce los códigos que NextAuth pone en
   ?error=... a mensajes accionables en español.

   Fuente de códigos: https://authjs.dev/guides/pages/error
   (algunos también llegan como "CallbackRouteError", "Signin",
   etc. según versión — default a genérico.)
   ═══════════════════════════════════════════════════════════════ */

export const AUTH_ERROR_MESSAGES = {
  Configuration:      "Configuración de autenticación incorrecta. Contacta al administrador.",
  AccessDenied:       "Acceso denegado. Tu cuenta no está autorizada en esta organización.",
  Verification:       "El enlace caducó o ya fue usado. Pide uno nuevo.",
  OAuthSignin:        "No pudimos iniciar sesión con ese proveedor. Intenta de nuevo.",
  OAuthCallback:      "El proveedor rechazó el inicio de sesión. Intenta con otro método.",
  OAuthCreateAccount: "No pudimos crear la cuenta con ese proveedor.",
  EmailCreateAccount: "No pudimos crear la cuenta con ese correo.",
  Callback:           "Falló el callback de autenticación. Intenta de nuevo.",
  OAuthAccountNotLinked: "Este correo ya está registrado con otro método. Usa el método original.",
  EmailSignin:        "No pudimos enviar el enlace. Verifica el correo e inténtalo otra vez.",
  CredentialsSignin:  "Credenciales incorrectas.",
  SessionRequired:    "Necesitas iniciar sesión para continuar.",
  CallbackRouteError: "Error en el proceso de autenticación. Intenta de nuevo.",
  Signin:             "No se pudo iniciar sesión. Intenta de nuevo.",
  Default:            "No se pudo iniciar sesión. Intenta de nuevo.",
};

/**
 * @param {string|null|undefined} code — valor de ?error= en la URL
 * @returns {string|null} mensaje en español, o null si no hay error
 */
export function describeAuthError(code) {
  if (!code) return null;
  return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES.Default;
}
