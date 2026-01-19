import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, Client, TokenSet, UserinfoResponse } from 'openid-client';

@Injectable()
export class OidcService implements OnModuleInit {
  private client: Client;
  private readonly logger = new Logger(OidcService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const issuerUrl = this.configService.get<string>('OIDC_ISSUER');
      if (!issuerUrl) {
        this.logger.warn('OIDC_ISSUER not set, OIDC will not work');
        return;
      }

      const issuer = await Issuer.discover(issuerUrl);
      this.logger.log(`Discovered OIDC issuer: ${issuer.issuer}`);

      this.client = new issuer.Client({
        client_id: this.configService.get<string>('OIDC_CLIENT_ID') || '',
        client_secret:
          this.configService.get<string>('OIDC_CLIENT_SECRET') || '',
        redirect_uris: [
          this.configService.get<string>('OIDC_CALLBACK_URL') || '',
        ],
        response_types: ['code'],
      });
    } catch (error) {
      this.logger.error(`Failed to initialize OIDC client: ${error.message}`);
    }
  }

  getAuthorizationUrl(code_challenge: string, state: string): string {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }

    return this.client.authorizationUrl({
      scope: 'openid profile email', // Standard scopes
      code_challenge,
      code_challenge_method: 'S256',
      state,
    });
  }

  async exchangeCode(
    req: any,
    code_verifier: string,
    state: string,
  ): Promise<{ tokenSet: TokenSet; userinfo: UserinfoResponse }> {
    if (!this.client) {
      throw new Error('OIDC client not initialized');
    }

    const params = this.client.callbackParams(req);
    const callbackUrl = this.configService.get<string>('OIDC_CALLBACK_URL');

    const tokenSet = await this.client.callback(callbackUrl, params, {
      code_verifier,
      state,
    });

    if (!tokenSet.access_token) {
      throw new Error('No access token received from OIDC provider');
    }

    const userinfo = await this.client.userinfo(tokenSet.access_token);
    return { tokenSet, userinfo };
  }
}
