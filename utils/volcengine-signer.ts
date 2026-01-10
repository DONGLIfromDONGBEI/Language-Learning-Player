import crypto from 'crypto';

/**
 * 火山引擎 V4 签名实现 - 专为 OpenSpeech (TTS) 优化
 */
export function signVolcengineRequest(
  request: {
    method: string;
    path: string;
    host: string;
    region: string;
    service: string;
    headers: Record<string, string>;
    body: string;
  },
  credentials: { ak: string; sk: string }
) {
  const { method, path, host, region, service, headers, body } = request;
  const { ak, sk } = credentials;

  // 1. 准备时间戳
  const now = new Date();
  const xDate = now.toISOString().replace(/[:\-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateShort = xDate.substring(0, 8); // YYYYMMDD

  // 2. 规范化 Headers (必须包含 host, x-date, x-content-sha256)
  const contentSha256 = crypto.createHash('sha256').update(body).digest('hex');
  
  // 关键修复：所有 Header Key 必须转为小写参与签名；同时保留发送时的首字母大写版本
  const internalHeadersLower: Record<string, string> = {};
  Object.keys(headers).forEach(key => {
    internalHeadersLower[key.toLowerCase()] = headers[key].trim();
  });
  internalHeadersLower['host'] = host;
  internalHeadersLower['x-date'] = xDate;
  internalHeadersLower['x-content-sha256'] = contentSha256;

  // 生成 SignedHeaders 列表 (按字母顺序排序)
  const sortedHeaderKeys = Object.keys(internalHeadersLower).sort();
  const signedHeadersKeys = sortedHeaderKeys.join(';');

  // 生成 Canonical Headers
  const canonicalHeaders = sortedHeaderKeys
    .map(key => `${key}:${internalHeadersLower[key]}`)
    .join('\n') + '\n';

  // 3. 构建 Canonical Request
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    '', // QueryString 为空
    canonicalHeaders,
    signedHeadersKeys,
    contentSha256
  ].join('\n');

  console.log('[Signer] CanonicalRequest:\n', canonicalRequest);

  // 4. 构建 String To Sign
  const credentialScope = `${dateShort}/${region}/${service}/request`;
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  const stringToSign = ['HMAC-SHA256', xDate, credentialScope, hashedCanonicalRequest].join('\n');

  console.log('[Signer] StringToSign:\n', stringToSign);

  // 5. 计算 Signing Key
  const kDate = hmac(sk, dateShort);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'request');

  // 6. 计算 Signature
  const signature = hmac(kSigning, stringToSign).toString('hex');

  // 7. 返回结果：直接返回参与签名的全小写 Header，确保与 SignedHeaders 完全一致
  return {
    signedHeaders: internalHeadersLower,
    authorization: `HMAC-SHA256 Credential=${ak}/${credentialScope}, SignedHeaders=${signedHeadersKeys}, Signature=${signature}`
  };
}

function hmac(key: string | Buffer, data: string) {
  return crypto.createHmac('sha256', key).update(data).digest();
}
