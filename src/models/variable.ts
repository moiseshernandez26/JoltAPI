import type { HttpMethod } from './httpRequest';
import type { IHttpRequest } from './httpRequest';

/**
 * A single named variable for {{interpolation}}.
 */
export interface IVariable {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

/**
 * A flat set of variables used for request interpolation.
 */
export interface IVariableSet {
  variables: IVariable[];
}
