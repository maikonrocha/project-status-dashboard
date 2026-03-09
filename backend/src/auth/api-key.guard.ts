import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    private readonly apiKey: string;

    constructor(private readonly configService: ConfigService) {
        this.apiKey = this.configService.get<string>('API_KEY') || '';
    }

    canActivate(context: ExecutionContext): boolean {
        if (!this.apiKey) {
            // If no API_KEY is configured, deny all requests in production
            // but allow in development for backwards compatibility
            const nodeEnv = this.configService.get<string>('NODE_ENV') || 'development';
            if (nodeEnv === 'production') {
                throw new UnauthorizedException('API_KEY is not configured on the server.');
            }
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const requestApiKey = request.headers['x-api-key'] as string;

        if (!requestApiKey || requestApiKey !== this.apiKey) {
            throw new UnauthorizedException('Invalid or missing API key.');
        }

        return true;
    }
}
