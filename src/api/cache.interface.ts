import { StatusResponse } from './status-response.interface';

export interface Cache {
  timestamp: Date;
  response: StatusResponse;
}
