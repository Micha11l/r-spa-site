#!/bin/bash

echo "=== 检查组件类型和导入 ==="

for file in \
  ./components/redeem/EmailVerification.tsx \
  ./components/redeem/RedeemFlow.tsx; do
  if [ -f "$file" ]; then
    echo "=== $file ==="
    echo "1. 组件类型:"
    grep -n "use client" "$file" && echo "✅ 客户端组件" || echo "🔧 服务端组件"
    
    echo ""
    echo "2. 导入语句:"
    grep -n "import.*from" "$file" | grep -E "(supabase|validation|redeem)"
    
    echo ""
    echo "3. 文件前10行:"
    head -n 10 "$file"
    echo "---"
  else
    echo "❌ 文件不存在: $file"
  fi
  echo ""
done
