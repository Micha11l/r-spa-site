#!/usr/bin/env node

/**
 * 环境变量检查脚本
 * 在部署前验证所有必需的环境变量是否已配置
 *
 * 使用方法：
 * node scripts/check-env.js
 */

const requiredEnvVars = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': {
    required: true,
    description: 'Supabase项目URL',
    example: 'https://xxx.supabase.co'
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    required: true,
    description: 'Supabase匿名密钥',
    example: 'eyJhbGciOiJIUzI1NiIs...'
  },
  'SUPABASE_SERVICE_ROLE': {
    required: true,
    description: 'Supabase服务密钥（后端专用）',
    example: 'eyJhbGciOiJIUzI1NiIs...'
  },

  // Stripe
  'STRIPE_SECRET_KEY': {
    required: true,
    description: 'Stripe密钥',
    example: 'sk_test_... 或 sk_live_...',
    validate: (val) => {
      if (process.env.NODE_ENV === 'production' && val.startsWith('sk_test_')) {
        return '⚠️  警告：生产环境使用了测试密钥！';
      }
      return null;
    }
  },
  'STRIPE_WEBHOOK_SECRET': {
    required: true,
    description: 'Stripe Webhook签名密钥',
    example: 'whsec_...'
  },
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': {
    required: false,
    description: 'Stripe公开密钥（前端使用）',
    example: 'pk_test_... 或 pk_live_...'
  },

  // Email
  'RESEND_API_KEY': {
    required: true,
    description: 'Resend邮件服务API密钥',
    example: 're_...'
  },
  'RESEND_OWNER_EMAIL': {
    required: false,
    description: '店主通知邮箱',
    example: 'booking@nesses.ca'
  },

  // Zoho SMTP (备用)
  'ZOHO_SMTP_USER': {
    required: false,
    description: 'Zoho SMTP用户名',
    example: 'michael@nesses.ca'
  },
  'ZOHO_SMTP_PASS': {
    required: false,
    description: 'Zoho SMTP密码',
    example: '12位App Password'
  },

  // Admin
  'ADMIN_PASSCODE': {
    required: true,
    description: '管理员登录密码',
    example: '强密码（12+位）',
    validate: (val) => {
      if (val.length < 8) {
        return '❌ 密码太短！建议至少12位';
      }
      if (val === '010519' || val === 'admin' || val === 'password') {
        return '❌ 密码太简单！请使用强密码';
      }
      if (!/[A-Z]/.test(val) || !/[a-z]/.test(val) || !/[0-9]/.test(val)) {
        return '⚠️  建议包含大写、小写和数字';
      }
      return null;
    }
  },
  'ADMIN_ENTRY_TOKEN': {
    required: true,
    description: '管理员URL Token',
    example: '64位随机字符串',
    validate: (val) => {
      if (val.length < 32) {
        return '❌ Token太短！建议64位随机字符串';
      }
      if (val === 'very-long-secret-abc123') {
        return '❌ 请使用随机生成的token！运行: openssl rand -hex 32';
      }
      return null;
    }
  },
  'NEXT_PUBLIC_ADMIN_SECRET_PATH': {
    required: false,
    description: '管理员隐秘访问路径',
    example: '/s/your-secret-path'
  },

  // Site
  'NEXT_PUBLIC_SITE_URL': {
    required: true,
    description: '网站URL',
    example: 'https://rejuvenessence.org',
    validate: (val) => {
      if (process.env.NODE_ENV === 'production' && val.includes('localhost')) {
        return '❌ 生产环境不能使用localhost！';
      }
      if (!val.startsWith('http')) {
        return '❌ URL必须包含协议（http/https）';
      }
      return null;
    }
  },
  'SITE_URL': {
    required: false,
    description: '网站URL（备用）',
    example: 'https://rejuvenessence.org'
  },
  'SITE_NAME': {
    required: false,
    description: '网站名称',
    example: 'Rejuvenessence'
  },
  'TIMEZONE': {
    required: false,
    description: '时区',
    example: 'America/Toronto'
  }
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvironment() {
  log('\n🔍 检查环境变量配置...\n', 'cyan');

  const env = process.env.NODE_ENV || 'development';
  log(`环境：${env}\n`, 'blue');

  let hasErrors = false;
  let hasWarnings = false;
  const missing = [];
  const warnings = [];

  // Check each required variable
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];
    const status = value ? '✅' : (config.required ? '❌' : '⚠️ ');

    if (!value && config.required) {
      hasErrors = true;
      missing.push({
        key,
        description: config.description,
        example: config.example
      });
      log(`${status} ${key}`, 'red');
      log(`   ${config.description}`, 'gray');
    } else if (!value && !config.required) {
      log(`${status} ${key} (可选)`, 'yellow');
    } else {
      // Value exists, check validation
      if (config.validate) {
        const validationError = config.validate(value);
        if (validationError) {
          hasWarnings = true;
          warnings.push({ key, message: validationError });
          log(`${status} ${key}: ${validationError}`, 'yellow');
        } else {
          log(`${status} ${key}`, 'green');
        }
      } else {
        log(`${status} ${key}`, 'green');
      }
    }
  });

  // Print summary
  log('\n' + '='.repeat(60), 'gray');

  if (hasErrors) {
    log('\n❌ 发现缺失的必需环境变量：\n', 'red');
    missing.forEach(({ key, description, example }) => {
      log(`  ${key}`, 'red');
      log(`    说明：${description}`, 'gray');
      log(`    示例：${example}`, 'gray');
      log('');
    });
  }

  if (hasWarnings) {
    log('\n⚠️  警告：\n', 'yellow');
    warnings.forEach(({ key, message }) => {
      log(`  ${key}: ${message}`, 'yellow');
    });
    log('');
  }

  if (!hasErrors && !hasWarnings) {
    log('\n✅ 所有环境变量配置正确！\n', 'green');
  } else if (hasErrors) {
    log('\n❌ 请配置缺失的环境变量后再部署\n', 'red');
    log('参考文件：.env.production.example\n', 'gray');
    process.exit(1);
  } else {
    log('\n⚠️  存在警告，建议修复后再部署\n', 'yellow');
  }

  // Security recommendations
  if (env === 'production') {
    log('\n🔒 生产环境安全检查：\n', 'cyan');

    const securityChecks = [
      {
        check: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
        message: 'Stripe 使用生产密钥'
      },
      {
        check: process.env.ADMIN_PASSCODE?.length >= 12,
        message: '管理员密码足够强'
      },
      {
        check: process.env.ADMIN_ENTRY_TOKEN?.length >= 32,
        message: 'Admin token 足够长'
      },
      {
        check: !process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost'),
        message: '站点URL配置正确'
      }
    ];

    securityChecks.forEach(({ check, message }) => {
      log(`  ${check ? '✅' : '❌'} ${message}`, check ? 'green' : 'red');
    });

    log('');
  }

  log('='.repeat(60) + '\n', 'gray');
}

// Run the check
checkEnvironment();
