import MessageResponse from './MessageResponse';

type ErrorResponse = {
  stack?: string;
} & MessageResponse;
export default ErrorResponse;
