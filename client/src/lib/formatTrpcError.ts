import type { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../../../server/routers";

type ZodIssue = { message?: string; path?: (string | number)[] };

export function formatTrpcErrorMessage(err: TRPCClientError<AppRouter>): string {
  const zodError = err.data?.zodError;
  if (zodError && typeof zodError === "object" && "fieldErrors" in zodError) {
    const fieldErrors = zodError.fieldErrors as Record<string, string[] | undefined>;
    const first = Object.entries(fieldErrors).find(([, msgs]) => msgs?.length);
    if (first) {
      const [field, msgs] = first;
      const label =
        field === "username"
          ? "Usuário"
          : field === "password"
            ? "Senha"
            : field === "platformObjective"
              ? "Objetivo"
              : field;
      return `${label}: ${msgs![0]}`;
    }
  }

  try {
    const parsed = JSON.parse(err.message) as ZodIssue[];
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
      return parsed
        .map(issue => {
          const field = issue.path?.[0];
          const label =
            field === "username"
              ? "Usuário"
              : typeof field === "string"
                ? field
                : "Campo";
          return `${label}: ${issue.message}`;
        })
        .join(" · ");
    }
  } catch {
    // not JSON
  }

  return err.message;
}
