export interface MessageEnvelope<T> {
  version: number;
  type: 'email';
  payload: T;
}
