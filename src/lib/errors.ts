// Message neutre pour l'utilisateur, détail technique seulement dans les logs serveur.
export function logError(scope: string, error: { code?: string; message?: string } | null) {
  if (error) console.error(`[${scope}]`, error.code ?? "", error.message ?? "");
}
