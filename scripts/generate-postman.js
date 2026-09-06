const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Converter = require('openapi-to-postmanv2');

const openapiPath = path.join(__dirname, '..', 'openapi.json');
const outputDir = path.join(__dirname, '..', 'postman');
const collectionOutputPath = path.join(outputDir, 'collection.json');
const environmentOutputPath = path.join(outputDir, 'environment.json');

function walk(node, fn) {
  fn(node);
  if (Array.isArray(node.item)) {
    node.item.forEach((child) => walk(child, fn));
  }
}

/** openapi-to-postmanv2 對 bearerAuth 安全機制產生的變數固定叫 bearerToken，改用 token 統一命名 */
function renameBearerTokenVariable(node) {
  if (node.request && node.request.auth && node.request.auth.type === 'bearer') {
    node.request.auth.bearer = [{ key: 'token', value: '{{token}}', type: 'string' }];
  }
}

function findLoginRequest(node) {
  if (node.request) {
    const segments = (node.request.url && node.request.url.path) || [];
    if (node.request.method === 'POST' && segments.includes('auth') && segments.includes('login')) {
      return node;
    }
  }
  if (Array.isArray(node.item)) {
    for (const child of node.item) {
      const found = findLoginRequest(child);
      if (found) return found;
    }
  }
  return null;
}

function containsRequest(node, target) {
  if (node === target) return true;
  if (Array.isArray(node.item)) {
    return node.item.some((child) => containsRequest(child, target));
  }
  return false;
}

/** newman 依 item 陣列順序做深度優先執行，遞迴地把含有 target 的分支移到每一層陣列最前面，
 *  確保 target（登入請求）在整個 collection 中最早被執行 */
function bringToFront(node, target) {
  if (!Array.isArray(node.item)) return;
  const index = node.item.findIndex((child) => containsRequest(child, target));
  if (index === -1) return;
  if (index > 0) {
    const [child] = node.item.splice(index, 1);
    node.item.unshift(child);
  }
  bringToFront(node.item[0], target);
}

Converter.convert({ type: 'file', data: openapiPath }, {}, (err, result) => {
  if (err || !result.result) {
    console.error('OpenAPI → Postman 轉換失敗：', err || result.reason);
    process.exit(1);
  }

  const collection = result.output[0].data;

  // baseUrl 已由 servers[0].url 自動產生，這裡補上 token / sessionId 變數
  const existingKeys = new Set((collection.variable || []).map((v) => v.key));
  collection.variable = collection.variable || [];
  if (!existingKeys.has('token')) {
    collection.variable.push({ key: 'token', value: '', type: 'string' });
  }
  if (!existingKeys.has('sessionId')) {
    collection.variable.push({ key: 'sessionId', value: '', type: 'string' });
  }

  walk(collection, renameBearerTokenVariable);

  const loginRequest = findLoginRequest(collection);
  if (loginRequest) {
    // 帶入專案預設種子帳號，讓登入請求真正成功，才能自動存到有效 JWT
    loginRequest.request.body = {
      mode: 'raw',
      raw: JSON.stringify({ email: 'admin@hexschool.com', password: '12345678' }, null, 2),
      options: { raw: { language: 'json' } },
    };

    loginRequest.event = loginRequest.event || [];
    loginRequest.event.push({
      listen: 'test',
      script: {
        type: 'text/javascript',
        exec: [
          "if (pm.response.code === 200) {",
          "  var body = pm.response.json();",
          "  if (body && body.data && body.data.token) {",
          "    pm.collectionVariables.set('token', body.data.token);",
          "  }",
          "}",
        ],
      },
    });

    // 讓登入請求成為整個 collection 中最早執行的項目，確保後續需要 Bearer Token 的請求都能拿到剛登入的 token
    bringToFront(collection, loginRequest);
  } else {
    console.warn('警告：找不到登入端點，未加入自動儲存 token 的 test script');
  }

  // 獨立的 Postman Environment：只放 baseUrl（真正該隨環境切換的值）。
  // token/sessionId 是執行期間動態產生的值，維持放在 Collection Variables，
  // 避免 Environment 的空值（優先權高於 Collection Variables）蓋掉登入後存入的 token。
  const environment = {
    id: crypto.randomUUID(),
    name: 'Bloom & Co. Local',
    values: [
      { key: 'baseUrl', value: 'http://localhost:3001', type: 'default', enabled: true },
    ],
    _postman_variable_scope: 'environment',
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(collectionOutputPath, JSON.stringify(collection, null, 2));
  fs.writeFileSync(environmentOutputPath, JSON.stringify(environment, null, 2));
  console.log(`Postman collection 已產生：${path.relative(process.cwd(), collectionOutputPath)}`);
  console.log(`Postman environment 已產生：${path.relative(process.cwd(), environmentOutputPath)}`);
});
