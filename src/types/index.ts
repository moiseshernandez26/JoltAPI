/**
 * Discriminated union helper: extract the union member matching a specific command string.
 */
export type MessageOfType<
  T extends { command: string },
  C extends T['command'],
> = T extends { command: C } ? T : never;
