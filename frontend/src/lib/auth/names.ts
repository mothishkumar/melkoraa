export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string | null;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: null };
  }
  if (parts.length === 1) {
    return { firstName: parts[0]!, lastName: null };
  }
  return {
    firstName: parts[0]!,
    lastName: parts.slice(1).join(" "),
  };
}

export function displayName(input: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  const name = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
  if (name) return name;
  return input.email ?? "Account";
}
