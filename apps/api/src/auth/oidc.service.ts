import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Issuer, Client, TokenSet, UserinfoResponse } from 'openid-client';

export enum OidcType {
  VOTER = 'voter',
  ADMIN = 'admin',
}

@Injectable()
export class OidcService implements OnModuleInit {
  private voterClient: Client;
  private adminClient: Client;
  private readonly logger = new Logger(OidcService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initClient(OidcType.VOTER);
    await this.initClient(OidcType.ADMIN);
  }

  private async initClient(type: OidcType) {
    try {
      const prefix = type === OidcType.VOTER ? 'VOTER_OIDC' : 'ADMIN_OIDC';
      const issuerUrl = this.configService.get<string>(`${prefix}_ISSUER`);
      
      if (!issuerUrl) {
        this.logger.warn(`${prefix}_ISSUER not set, ${type} OIDC will not work`);
        return;
      }

      const issuer = await Issuer.discover(issuerUrl);
      const client = new issuer.Client({
        client_id: this.configService.get<string>(`${prefix}_CLIENT_ID`) || '',
        client_secret: this.configService.get<string>(`${prefix}_CLIENT_SECRET`) || '',
        redirect_uris: [this.configService.get<string>(`${prefix}_CALLBACK_URL`) || ''],
        response_types: ['code'],
      });

      if (type === OidcType.VOTER) this.voterClient = client;
      else this.adminClient = client;

      this.logger.log(`Initialized ${type} OIDC client for ${issuer.issuer}`);
    } catch (error) {
      this.logger.error(`Failed to initialize ${type} OIDC client: ${error.message}`);
    }
  }

  getAuthorizationUrl(type: OidcType, code_challenge: string, state: string): string {
    const client = type === OidcType.VOTER ? this.voterClient : this.adminClient;
    if (!client) throw new Error(`${type} OIDC client not initialized`);

    return client.authorizationUrl({
      scope: 'openid profile email',
      code_challenge,
      code_challenge_method: 'S256',
      state,
    });
  }

  async exchangeCode(
    type: OidcType,
    req: any,
    code_verifier: string,
    state: string,
  ): Promise<{ tokenSet: TokenSet; userinfo: UserinfoResponse }> {
    const client = type === OidcType.VOTER ? this.voterClient : this.adminClient;
    if (!client) throw new Error(`${type} OIDC client not initialized`);

    const prefix = type === OidcType.VOTER ? 'VOTER_OIDC' : 'ADMIN_OIDC';
    const callbackUrl = this.configService.get<string>(`${prefix}_CALLBACK_URL`);

    const params = client.callbackParams(req);
    const tokenSet = await client.callback(callbackUrl, params, {
      code_verifier,
      state,
    });

    if (!tokenSet.access_token) {
      throw new Error(`No access token received from ${type} OIDC provider`);
    }

    const userinfo = await client.userinfo(tokenSet.access_token);
    return { tokenSet, userinfo };
  }
}
