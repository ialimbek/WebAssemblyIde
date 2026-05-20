/** Command definition with metadata */
export interface CommandDefinition<TPayload = void> {
  id: string;
  label: string;
  description?: string;
  category?: string;
  payload?: TPayload;
}

/** Command handler function */
export type CommandHandler<TPayload = void> = (
  payload: TPayload,
) => void | Promise<void>;
