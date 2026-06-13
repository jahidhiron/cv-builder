/**
 * Base fields shared by all email option shapes.
 */
export interface BaseEmailOptions {
  /** Primary recipient address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** Template / extra data merged into the compiled Handlebars template. */
  context?: Record<string, unknown>;
  /** Raw HTML body — used when no template is specified. */
  html?: string;
  /** Plain-text fallback. Auto-derived from `html` when omitted. */
  text?: string;
  /** Sender address override. Falls back to the configured default. */
  from?: string;
}

/** Discriminant: email is sent without a Handlebars template. */
interface NoTemplate {
  module?: undefined;
  template?: undefined;
}

/** Discriminant: email is rendered from a Handlebars template. */
interface WithTemplate {
  /** Module folder used to resolve the template path. */
  module: string;
  /** Handlebars template filename without the `.hbs` extension. */
  template: string;
}

/**
 * Union of {@link BaseEmailOptions} with either {@link NoTemplate} or {@link WithTemplate}.
 *
 * TypeScript will enforce that `module` and `template` are either both present
 * or both absent, preventing partially-configured template emails.
 */
export type SendEmailOptions = BaseEmailOptions & (NoTemplate | WithTemplate);
