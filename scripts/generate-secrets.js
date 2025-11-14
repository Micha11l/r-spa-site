#!/usr/bin/env node

/**
 * 安全凭证生成工具
 * 生成管理员密码、Token 和其他安全凭证
 *
 * 使用方法：
 * node scripts/generate-secrets.js
 */

const crypto = require('crypto');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generatePassword(length = 20) {
  // 生成包含大小写、数字和特殊字符的密码
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const allChars = uppercase + lowercase + numbers + special;

  let password = '';

  // 确保至少包含每种类型的字符
  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += numbers[crypto.randomInt(numbers.length)];
  password += special[crypto.randomInt(special.length)];

  // 填充剩余长度
  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  // 打乱顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateSecretPath() {
  const token = crypto.randomBytes(16).toString('hex');
  return `/s/${token}`;
}

function main() {
  log('\n🔐 生成安全凭证', 'cyan');
  log('=' .repeat(70), 'cyan');

  log('\n📝 将以下内容复制到你的环境变量配置中：\n', 'bright');

  // Generate Admin Password
  const adminPassword = generatePassword(16);
  log('# 管理员登录密码（建议保存到密码管理器）', 'yellow');
  log(`ADMIN_PASSCODE=${adminPassword}`, 'green');

  // Generate Admin Token
  const adminToken = generateToken(32);
  log('\n# 管理员 URL Token（用于 /admin/login?t=TOKEN）', 'yellow');
  log(`ADMIN_ENTRY_TOKEN=${adminToken}`, 'green');

  // Generate Secret Path
  const secretPath = generateSecretPath();
  log('\n# 管理员隐秘访问路径', 'yellow');
  log(`NEXT_PUBLIC_ADMIN_SECRET_PATH=${secretPath}`, 'green');

  log('\n' + '='.repeat(70), 'cyan');

  // Additional recommendations
  log('\n💡 使用建议：\n', 'cyan');
  log('1. 立即保存这些凭证到密码管理器（1Password, Bitwarden等）', 'yellow');
  log('2. 在 Vercel Dashboard 更新这些环境变量', 'yellow');
  log('3. 重新部署应用以使新凭证生效', 'yellow');
  log('4. 测试新凭证能正常登录', 'yellow');
  log('5. 删除/失效旧凭证', 'yellow');

  log('\n🔗 访问链接：\n', 'cyan');
  log(`隐秘登录页面: https://rejuvenessence.org${secretPath}`, 'blue');
  log(`Token 登录: https://rejuvenessence.org/admin/login?t=${adminToken}`, 'blue');

  log('\n⚠️  安全提醒：\n', 'red');
  log('• 不要在 Git 中提交这些凭证', 'red');
  log('• 不要在 Slack/Email 中明文分享', 'red');
  log('• 建议每 3 个月轮换一次', 'red');
  log('• 启用所有服务的 2FA', 'red');

  log('\n✅ 完成！\n', 'green');

  // Vercel CLI commands
  log('🚀 使用 Vercel CLI 更新环境变量：\n', 'cyan');
  log(`vercel env add ADMIN_PASSCODE production`, 'gray');
  log(`# 粘贴: ${adminPassword}\n`, 'gray');
  log(`vercel env add ADMIN_ENTRY_TOKEN production`, 'gray');
  log(`# 粘贴: ${adminToken}\n`, 'gray');
  log(`vercel env add NEXT_PUBLIC_ADMIN_SECRET_PATH production`, 'gray');
  log(`# 粘贴: ${secretPath}\n`, 'gray');

  log('='.repeat(70) + '\n', 'cyan');
}

main();
