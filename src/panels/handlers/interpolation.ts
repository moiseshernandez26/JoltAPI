export function interpolateTemplate(
  text: string,
  variables: { key: string; value: string; enabled: boolean }[],
): string {
  if (!text) {return text;}
  return text.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g, (_match, name: string) => {
    const variable = variables.find((v) => v.key === name && v.enabled);
    return variable ? variable.value : _match;
  });
}

export function extractUnresolved(...texts: string[]): string[] {
  const allMatches: string[] = [];
  for (const text of texts) {
    const matches = text.match(/\{\{([a-zA-Z_][a-zA-Z0-9_-]*)\}\}/g);
    if (matches) {allMatches.push(...matches);}
  }
  return [...new Set(allMatches)];
}