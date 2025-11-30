import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SamlAuthGuard extends AuthGuard('saml') {
    async canActivate(context: ExecutionContext) {
        console.log('SamlAuthGuard: Initiating SAML authentication...');
        try {
            const result = (await super.canActivate(context)) as boolean;
            console.log('SamlAuthGuard: Authentication initiated successfully, result:', result);
            return result;
        } catch (error) {
            console.error('SamlAuthGuard: Error initiating authentication', error);
            // Log the full error stack if available
            if (error instanceof Error) {
                console.error(error.stack);
            }
            throw error;
        }
    }
}