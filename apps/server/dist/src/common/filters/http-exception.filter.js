"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const traceId = (0, uuid_1.v4)();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'internal_server_error';
        let details = null;
        if (exception instanceof common_1.HttpException) {
            const res = exception.getResponse();
            if (typeof res === 'object' && res !== null) {
                const errorObj = res;
                message = errorObj.message || exception.message;
                code = this.mapStatusToCode(status);
                if (Array.isArray(errorObj.message)) {
                    message = 'Validation failed';
                    details = errorObj.message.map((msg) => ({
                        field: 'unknown',
                        issue: msg,
                    }));
                }
            }
            else {
                message = exception.message;
            }
        }
        else {
            this.logger.error(`[${traceId}] Critical System Error:`, exception);
        }
        const errorResponse = {
            traceId,
            code,
            message,
            details: details || undefined,
            timestamp: new Date().toISOString(),
            path: request.url,
        };
        response.status(status).json(errorResponse);
    }
    mapStatusToCode(status) {
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
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map