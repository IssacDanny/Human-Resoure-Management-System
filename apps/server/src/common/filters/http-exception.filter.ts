import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const traceId = uuidv4();

    // Determine the HTTP Status
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine the Error Message and Details
    let message = 'Internal server error';
    let code = 'internal_server_error';
    let details = null;

    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      
      // Handle standard NestJS validation errors (class-validator)
      if (typeof res === 'object' && res !== null) {
        const errorObj = res as any;
        message = errorObj.message || exception.message;
        
        // Map HTTP Status to your API Style Guide Codes
        code = this.mapStatusToCode(status);

        // If it's a validation error array, map it to 'details'
        if (Array.isArray(errorObj.message)) {
          message = 'Validation failed';
          details = errorObj.message.map((msg: string) => ({
            field: 'unknown', // class-validator doesn't always give the field name easily in the default array
            issue: msg,
          }));
        }
      } else {
        message = exception.message;
      }
    } else {
      // Log the actual system error for the developer, but hide it from the user
      this.logger.error(`[${traceId}] Critical System Error:`, exception);
    }

    // Construct the Final JSON Response (Matching specs/_shared/errors.yaml)
    const errorResponse = {
      traceId,
      code,
      message,
      details: details || undefined, // Only include if exists
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private mapStatusToCode(status: number): string {
    switch (status) {
      case 400: return 'validation_error';
      case 401: return 'unauthorized';
      case 403: return 'forbidden';
      case 404: return 'resource_not_found';
      case 409: return 'conflict';
      case 422: return 'unprocessable_entity';
      default: return 'internal_server_error';
    }
  }
}