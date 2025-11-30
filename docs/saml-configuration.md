# SAML SSO 配置文檔

**專案**: NCUESA 去中心化匿名投票系統 (SAVote)  
**更新日期**: 2025-11-30  
**IdP 供應商**: Synology C2 Identity

---

## 1. IdP (Identity Provider) 配置資訊

### 基本資訊

- **Application Name**: `Voting_test`
- **Entity ID**: `c2id:ypRVlXVqG1UTsk4tK9pw`
- **IdP Domain**: `ncuesa.identity.us.synologyc2.com`

### 端點 (Endpoints)

| 類型 | Binding | URL |
|------|---------|-----|
| Single Sign-On (SSO) | HTTP-Redirect | `https://ncuesa.identity.us.synologyc2.com/sso/app/c2id:ypRVlXVqG1UTsk4tK9pw/sso/saml/` |
| Single Sign-On (SSO) | HTTP-POST | `https://ncuesa.identity.us.synologyc2.com/sso/app/c2id:ypRVlXVqG1UTsk4tK9pw/sso/saml/` |
| Single Logout (SLO) | HTTP-Redirect | `https://ncuesa.identity.us.synologyc2.com/sso/app/c2id:ypRVlXVqG1UTsk4tK9pw/slo/saml/` |
| Single Logout (SLO) | HTTP-POST | `https://ncuesa.identity.us.synologyc2.com/sso/app/c2id:ypRVlXVqG1UTsk4tK9pw/slo/saml/` |

### Name ID 格式支援

- `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
- `urn:oasis:names:tc:SAML:2.0:nameid-format:persistent`
- `urn:oasis:names:tc:SAML:2.0:nameid-format:transient`

### IdP X.509 憑證 (Signing Certificate)

**有效期限**: 2025-09-07 至 2035-09-06

```
-----BEGIN CERTIFICATE-----
MIICqzCCAZOgAwIBAgIRAPzdlns67FBFaRAEcCCtbD0wDQYJKoZIhvcNAQELBQAw
ETEPMA0GA1UEAxMGbmN1ZXNhMB4XDTI1MDkwNzE1MDY0MFoXDTM1MDkwNjE1MDY0
MFowETEPMA0GA1UEAxMGbmN1ZXNhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAj3V9AK2dUgODPi0o2eLXBp63wG/9+mRgLICp5TCOIhsiViMMzZM0jvYF
z2P2HRagRcqm6yy3HO4AuymxDfoV16zKwXeNbboXzclPoCIFePLx2cDK5yUp05Aq
uac9hgzgFFjyeVti13bF+YAhkD7Q4yFhKEslsM3ARSKqPBmgWUtpTKugf6mLxNU8
aF4rAji1KGMhDBdwrQfYaYyRMvpwqlt+a4lZCRYLoHWAloahapT1/a2SY/vZ9vsr
WoLfo2f9ZL58ajrWQGp2r+J7ZbkTEsY+Wa1V/4YaXCYksfjOZe/SbZ+V4EbEJM1f
3Q0EiLhBQROjcc7ce35obJ6KPJihoQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQAB
g82IW+6Y5YrRoCiuyV2JzNYCD7yquC3prz2Lb3n6BBsZykRZOaFp5sJ3/9PzAzyf
fEU/mT2li43uwZFfsY3RTLw4lBX1XfhN75vLstfGY+7X+eHhTxK3mrNvWLlZvCW6
9Q01J2cb6dYiTd3vW5oPJ2S/3LUYz206NqDLLNGLH6zzPTmPDsX6Peu6QU+tgqIU
XPsER+Gpdpc22NlWUH4TGijZ7b+u5M7KazchxfgbqvUAs6wilPvEx5z2G/+SJZJd
1zG+K+kwuWD+lkfVpBUkIpFX3uXCEHK6Q2xJh2pimdeF02TmBfQNKLaBIu/GYtKw
7XruGtDC/lq5Aq6v5/ir
-----END CERTIFICATE-----
```

---

## 2. SP (Service Provider) 配置

### 在 IdP 端配置的資訊

| 項目 | 值 |
|------|-----|
| **SP entity ID** | `https://api.voting.ncuesa.edu.tw/saml/metadata` |
| **Single sign-on URL** | `http://localhost:3000/auth/saml/callback` (開發環境)<br>`https://api.voting.ncuesa.edu.tw/auth/saml/callback` (生產環境) |
| **Name ID format** | `Unspecified` |
| **Default name ID** | `Primary email` |
| **SAML response** | `Sign` |
| **SAML assertion** | `Sign` |
| **Signature algorithm** | `RSA-SHA256` |
| **Digest algorithm** | `SHA256` |
| **Single logout (SLO)** | `Disable` |

---

## 3. Backend 環境變數配置

### 開發環境 (`apps/api/.env`)

```env
# SAML Configuration
SAML_ENTRY_POINT="https://ncuesa.identity.us.synologyc2.com/sso/app/c2id:ypRVlXVqG1UTsk4tK9pw/sso/saml/"
SAML_ISSUER="https://api.voting.ncuesa.edu.tw/saml/metadata"
SAML_CALLBACK_URL="http://localhost:3000/auth/saml/callback"

# IdP Certificate (完整的 X.509 PEM 格式)
SAML_IDP_CERT="-----BEGIN CERTIFICATE-----
MIICqzCCAZOgAwIBAgIRAPzdlns67FBFaRAEcCCtbD0wDQYJKoZIhvcNAQELBQAw
ETEPMA0GA1UEAxMGbmN1ZXNhMB4XDTI1MDkwNzE1MDY0MFoXDTM1MDkwNjE1MDY0
MFowETEPMA0GA1UEAxMGbmN1ZXNhMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAj3V9AK2dUgODPi0o2eLXBp63wG/9+mRgLICp5TCOIhsiViMMzZM0jvYF
z2P2HRagRcqm6yy3HO4AuymxDfoV16zKwXeNbboXzclPoCIFePLx2cDK5yUp05Aq
uac9hgzgFFjyeVti13bF+YAhkD7Q4yFhKEslsM3ARSKqPBmgWUtpTKugf6mLxNU8
aF4rAji1KGMhDBdwrQfYaYyRMvpwqlt+a4lZCRYLoHWAloahapT1/a2SY/vZ9vsr
WoLfo2f9ZL58ajrWQGp2r+J7ZbkTEsY+Wa1V/4YaXCYksfjOZe/SbZ+V4EbEJM1f
3Q0EiLhBQROjcc7ce35obJ6KPJihoQIDAQABMA0GCSqGSIb3DQEBCwUAA4IBAQAB
g82IW+6Y5YrRoCiuyV2JzNYCD7yquC3prz2Lb3n6BBsZykRZOaFp5sJ3/9PzAzyf
fEU/mT2li43uwZFfsY3RTLw4lBX1XfhN75vLstfGY+7X+eHhTxK3mrNvWLlZvCW6
9Q01J2cb6dYiTd3vW5oPJ2S/3LUYz206NqDLLNGLH6zzPTmPDsX6Peu6QU+tgqIU
XPsER+Gpdpc22NlWUH4TGijZ7b+u5M7KazchxfgbqvUAs6wilPvEx5z2G/+SJZJd
1zG+K+kwuWD+lkfVpBUkIpFX3uXCEHK6Q2xJh2pimdeF02TmBfQNKLaBIu/GYtKw
7XruGtDC/lq5Aq6v5/ir
-----END CERTIFICATE-----"

# SAML 安全設定
SAML_WANTS_ASSERTION_SIGNED="true"
SAML_WANTS_RESPONSE_SIGNED="true"
SAML_SIGNATURE_ALGORITHM="sha256"
SAML_DIGEST_ALGORITHM="sha256"

# Name ID Format
SAML_IDENTIFIER_FORMAT="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
```

### 生產環境差異

```env
# 生產環境需修改以下變數
SAML_CALLBACK_URL="https://api.voting.ncuesa.edu.tw/auth/saml/callback"
```

---

## 4. NestJS SAML Strategy 實作

### 檔案路徑: `apps/api/src/auth/saml.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from '@node-saml/passport-saml';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SamlStrategy extends PassportStrategy(Strategy, 'saml') {
  constructor(private configService: ConfigService) {
    super({
      // IdP 配置
      entryPoint: configService.get('SAML_ENTRY_POINT'),
      issuer: configService.get('SAML_ISSUER'),
      callbackUrl: configService.get('SAML_CALLBACK_URL'),
      cert: configService.get('SAML_IDP_CERT'),
      
      // 安全設定 (根據 IdP 配置)
      identifierFormat: configService.get('SAML_IDENTIFIER_FORMAT'),
      wantAssertionsSigned: configService.get('SAML_WANTS_ASSERTION_SIGNED') === 'true',
      wantAuthnResponseSigned: configService.get('SAML_WANTS_RESPONSE_SIGNED') === 'true',
      signatureAlgorithm: configService.get('SAML_SIGNATURE_ALGORITHM'),
      digestAlgorithm: configService.get('SAML_DIGEST_ALGORITHM'),
      
      // 其他設定
      attributeConsumingServiceIndex: false,
      disableRequestedAuthnContext: true,
      
      // 日誌 (開發環境)
      decryptionPvk: undefined, // 如果需要解密
      privateCert: undefined,   // 如果需要簽名請求
    });
  }

  async validate(profile: Profile): Promise<any> {
    // SAML assertion 中提取的用戶資訊
    // 根據 IdP 實際回傳的屬性調整
    console.log('SAML Profile:', profile); // 開發時用於查看實際屬性
    
    return {
      // 基本資訊
      nameID: profile.nameID,
      nameIDFormat: profile.nameIDFormat,
      email: profile.email || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      
      // 自定義屬性 (需根據 IdP 實際配置調整)
      studentId: profile['urn:oid:0.9.2342.19200300.100.1.1'] || profile['uid'],
      displayName: profile.displayName || profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      class: profile['department'] || profile['urn:oid:2.5.4.11'],
      
      // 原始 profile (用於調試)
      _raw: profile,
    };
  }
}
```

---

## 5. 測試流程

### 步驟 1: 啟動開發環境

```bash
# 啟動後端 API
cd apps/api
pnpm dev

# API 會運行在 http://localhost:3000
```

### 步驟 2: 觸發 SAML 登入

訪問: `http://localhost:3000/auth/saml/login`

### 步驟 3: IdP 登入

- 瀏覽器會自動重定向到 Synology C2 Identity 登入頁面
- 輸入 NCUESA 帳號密碼
- 完成 MFA (如果啟用)

### 步驟 4: 接收回調

- IdP 驗證成功後，會 POST SAML Response 到 callback URL
- Backend 接收到 `http://localhost:3000/auth/saml/callback`
- SAML strategy 驗證 assertion 簽名
- 提取用戶屬性並創建 session

### 步驟 5: 驗證結果

檢查後端日誌中的 SAML Profile，確認以下資訊：
- ✅ nameID (用戶唯一識別碼)
- ✅ email (主要 email)
- ✅ studentId (學號，需確認屬性名稱)
- ✅ displayName (顯示名稱)
- ✅ class/department (班級/系所)

---

## 6. 常見問題排查

### 問題 1: "Invalid signature" 或 "Signature verification failed"

**原因**: IdP 憑證配置錯誤

**解決方案**:
1. 確認 `SAML_IDP_CERT` 包含完整的 PEM 格式憑證
2. 確保憑證包含 `-----BEGIN CERTIFICATE-----` 和 `-----END CERTIFICATE-----`
3. 檢查憑證是否過期: `openssl x509 -in cert.pem -noout -dates`
4. 確認憑證內容沒有多餘的空白或換行

### 問題 2: "Callback URL mismatch"

**原因**: IdP 配置的 callback URL 與實際不符

**解決方案**:
1. 確保 IdP 端配置的 Single sign-on URL 為 `http://localhost:3000/auth/saml/callback`
2. 確保 `SAML_CALLBACK_URL` 環境變數與 IdP 設定完全一致
3. 注意 http/https 協議差異
4. 注意 port 號是否一致

### 問題 3: "SAML Response not found"

**原因**: POST request 沒有正確處理

**解決方案**:
1. 確保 NestJS 已啟用 body parser
2. 檢查 `apps/api/src/main.ts` 中的中間件配置
3. 確認路由正確註冊

### 問題 4: "Attribute not found" 或取不到 studentId

**原因**: SAML assertion 中的屬性名稱與代碼不符

**解決方案**:
1. 在 `validate()` 方法中添加 `console.log('SAML Profile:', profile)`
2. 查看實際回傳的屬性名稱
3. 根據實際屬性調整代碼中的屬性對應
4. 常見屬性格式:
   - OID 格式: `urn:oid:0.9.2342.19200300.100.1.1`
   - 友好名稱: `uid`, `email`, `displayName`
   - XML 命名空間: `http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress`

### 問題 5: "Clock skew detected"

**原因**: 伺服器時間與 IdP 時間不同步

**解決方案**:
```bash
# Linux/macOS
sudo ntpdate -s time.nist.gov

# Windows (以管理員權限執行)
w32tm /resync
```

### 問題 6: CORS 錯誤 (從前端觸發時)

**原因**: 後端未正確配置 CORS

**解決方案**:
在 `apps/api/src/main.ts` 中添加:
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});
```

---

## 7. 安全注意事項

### 7.1 憑證管理

- ✅ **永不提交**: 不要將 IdP 憑證提交到 Git repository
- ✅ **環境變數**: 透過 `.env` 檔案管理 (已加入 `.gitignore`)
- ✅ **定期檢查**: IdP 憑證將於 2035-09-06 過期，需提前更換

### 7.2 Callback URL 驗證

- ✅ **生產環境**: 使用 HTTPS (`https://api.voting.ncuesa.edu.tw`)
- ✅ **開發環境**: 僅限 localhost
- ✅ **白名單**: 在 IdP 端設定允許的 callback URL

### 7.3 SAML Assertion 驗證

- ✅ **簽名驗證**: 啟用 `wantAssertionsSigned` 和 `wantAuthnResponseSigned`
- ✅ **時間戳驗證**: 自動檢查 `NotBefore` 和 `NotOnOrAfter`
- ✅ **Replay 攻擊防護**: 使用 session ID 或 nonce

### 7.4 日誌記錄

- ✅ **登入事件**: 記錄所有 SAML 登入嘗試
- ✅ **失敗原因**: 記錄驗證失敗的具體原因
- ⚠️ **避免敏感資訊**: 不要記錄完整的 SAML assertion 或用戶密碼

---

## 8. 相關文件

- [Feature Specification](../specs/001-saml-sso-auth/spec.md)
- [Implementation Plan](../specs/001-saml-sso-auth/plan.md)
- [Research Notes](../specs/001-saml-sso-auth/research.md)
- [Quick Start Guide](../specs/001-saml-sso-auth/quickstart.md)
- [Tasks List](../specs/001-saml-sso-auth/tasks.md)

---

## 9. 聯絡資訊

- **技術支援**: NCUESA Development Team
- **Email**: dev@ncuesa.edu.tw
- **IdP 管理**: Synology C2 Identity 管理員

---

**文檔版本**: 1.0.0  
**最後更新**: 2025-11-30  
**維護者**: NCUESA Development Team
