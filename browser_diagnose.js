// ============================================
// 浏览器控制台诊断脚本
// ============================================
// 在 http://localhost:3000/redeem/[token] 页面
// 打开浏览器控制台 (F12) 并粘贴这段代码

(function() {
  console.clear();
  console.log('%c🔍 Gift Card 金额显示诊断', 'font-size: 20px; font-weight: bold; color: #4F46E5;');
  console.log('');

  // ============================================
  // 1. 检查页面 DOM
  // ============================================
  console.log('%c📄 步骤 1: 检查页面显示', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('----------------------------------------');

  // 查找显示金额的元素
  const amountElements = [
    document.querySelector('[class*="text-4xl"]'),
    document.querySelector('[class*="text-5xl"]'),
    ...Array.from(document.querySelectorAll('div')).filter(el => 
      el.textContent?.includes('$') && !el.querySelector('div')
    )
  ].filter(Boolean);

  if (amountElements.length > 0) {
    console.log('找到金额显示元素:');
    amountElements.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.textContent?.trim()}`);
      console.log(`     HTML: ${el.outerHTML.substring(0, 100)}...`);
    });
  } else {
    console.log('⚠️ 未找到金额显示元素');
  }

  console.log('');

  // ============================================
  // 2. 检查 React Props
  // ============================================
  console.log('%c🎨 步骤 2: 检查 React Props', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('----------------------------------------');

  // 尝试从 React Fiber 获取 props
  const reactRoot = document.querySelector('#__next, [data-reactroot]');
  
  if (reactRoot && reactRoot._reactRootContainer) {
    console.log('✅ 检测到 React 应用');
    
    // 尝试查找 props
    const findReactProps = (element) => {
      for (let key in element) {
        if (key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance')) {
          return element[key];
        }
      }
      return null;
    };

    const props = findReactProps(reactRoot);
    if (props) {
      console.log('React Props:', props);
    }
  }

  console.log('');

  // ============================================
  // 3. 测试 API 响应
  // ============================================
  console.log('%c📡 步骤 3: 测试 API 响应', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('----------------------------------------');

  const token = window.location.pathname.split('/').pop();
  console.log(`Token: ${token}`);

  fetch('/api/giftcard/redeem/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  })
  .then(res => res.json())
  .then(data => {
    console.log('');
    console.log('%cAPI 响应数据:', 'font-weight: bold;');
    console.table({
      'Gift Card ID': data.giftCard?.id,
      'Code': data.giftCard?.code,
      'Amount (API 返回)': data.giftCard?.amount,
      'Amount 类型': typeof data.giftCard?.amount,
      'Expires At': data.giftCard?.expiresAt
    });

    console.log('');
    console.log('%c💰 金额分析:', 'font-weight: bold;');
    
    const apiAmount = data.giftCard?.amount;
    const parsed = parseFloat(apiAmount);
    const formatted = parsed.toFixed(2);
    const wrongFormatted = (parsed / 100).toFixed(2);

    console.table({
      'API 返回的原始值': apiAmount,
      '解析为数字': parsed,
      '正确格式化 (parseFloat + toFixed)': formatted,
      '正确显示': `$${formatted}`,
      '': '---',
      '错误格式化 (÷100)': wrongFormatted,
      '错误显示': `$${wrongFormatted}`
    });

    console.log('');
    
    // 判断问题
    const displayedText = document.body.textContent || '';
    
    if (displayedText.includes(`$${formatted}`)) {
      console.log('%c✅ 显示正确！', 'color: green; font-size: 16px; font-weight: bold;');
      console.log(`   页面显示 $${formatted}`);
    } else if (displayedText.includes(`$${wrongFormatted}`)) {
      console.log('%c❌ 发现问题！', 'color: red; font-size: 16px; font-weight: bold;');
      console.log(`   页面显示 $${wrongFormatted} (错误)`);
      console.log(`   应该显示 $${formatted}`);
      console.log('');
      console.log('%c🔧 问题原因:', 'font-weight: bold;');
      console.log('   代码中对金额进行了额外的除以 100 操作');
      console.log('   API 已经返回了 dollars，不应该再转换');
      console.log('');
      console.log('%c🎯 修复方法:', 'font-weight: bold;');
      console.log('   在代码中查找 "/ 100" 并移除');
      console.log('   正确: parseFloat(giftCard.dollars).toFixed(2)');
      console.log('   错误: (parseFloat(giftCard.dollars) / 100).toFixed(2)');
    } else {
      console.log('%c⚠️ 未找到金额显示', 'color: orange; font-size: 16px; font-weight: bold;');
      console.log('   请检查页面是否正确加载');
    }
  })
  .catch(error => {
    console.error('API 请求失败:', error);
  });

  console.log('');

  // ============================================
  // 4. 提供调试工具
  // ============================================
  console.log('%c🛠️ 调试工具', 'font-size: 16px; font-weight: bold; color: #059669;');
  console.log('----------------------------------------');
  console.log('以下函数已添加到全局作用域:');
  console.log('');
  console.log('1. checkAmount(amount)');
  console.log('   - 检查金额转换是否正确');
  console.log('   - 示例: checkAmount("500")');
  console.log('');
  console.log('2. testConversions(cents)');
  console.log('   - 测试从 cents 到 dollars 的转换');
  console.log('   - 示例: testConversions(50000)');
  console.log('');

  // 添加全局调试函数
  window.checkAmount = function(amount) {
    console.clear();
    console.log('%c💰 金额检查结果', 'font-size: 18px; font-weight: bold; color: #4F46E5;');
    console.log('');
    
    const parsed = parseFloat(amount);
    const correct = parsed.toFixed(2);
    const wrong = (parsed / 100).toFixed(2);
    
    console.table({
      '输入值': amount,
      '输入类型': typeof amount,
      '解析后': parsed,
      '': '---',
      '✅ 正确显示': `$${correct}`,
      '❌ 错误显示 (如果÷100)': `$${wrong}`
    });

    console.log('');
    console.log('%c当前页面显示:', 'font-weight: bold;');
    const pageText = document.body.textContent || '';
    
    if (pageText.includes(`$${correct}`)) {
      console.log(`%c✅ $${correct} (正确)`, 'color: green; font-size: 16px;');
    } else if (pageText.includes(`$${wrong}`)) {
      console.log(`%c❌ $${wrong} (错误 - 多除了一次 100)`, 'color: red; font-size: 16px;');
    } else {
      console.log('⚠️ 未在页面中找到匹配的金额显示');
    }
  };

  window.testConversions = function(cents) {
    console.clear();
    console.log('%c🧪 转换测试', 'font-size: 18px; font-weight: bold; color: #4F46E5;');
    console.log('');
    
    const dollars = (cents / 100).toString();
    const wrongDollars = (parseFloat(dollars) / 100).toString();
    
    console.log('数据流测试:');
    console.log('');
    console.log(`%c1️⃣ 数据库存储 (cents)`, 'font-weight: bold;');
    console.log(`   ${cents} cents`);
    console.log('');
    console.log(`%c2️⃣ API 转换 (cents → dollars)`, 'font-weight: bold;');
    console.log(`   ${cents} / 100 = "${dollars}" dollars`);
    console.log('');
    console.log(`%c3️⃣ 前端显示`, 'font-weight: bold;');
    console.log(`   ✅ 正确: parseFloat("${dollars}").toFixed(2) = $${parseFloat(dollars).toFixed(2)}`);
    console.log(`   ❌ 错误: (parseFloat("${dollars}") / 100).toFixed(2) = $${wrongDollars}`);
    console.log('');
    
    console.table({
      '数据库 (cents)': cents,
      'API 返回 (dollars)': dollars,
      '正确显示': `$${parseFloat(dollars).toFixed(2)}`,
      '错误显示 (双重转换)': `$${parseFloat(wrongDollars).toFixed(2)}`
    });
  };

  console.log('');
  console.log('%c🎯 快速测试', 'font-size: 14px; font-weight: bold;');
  console.log('运行: checkAmount("500")');
  console.log('运行: testConversions(50000)');
  console.log('');
  console.log('诊断完成！');

})();
