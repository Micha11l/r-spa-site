#!/bin/bash

echo "=== Supabase 导入更新验证 ==="
echo ""

echo "1. 检查是否还有旧的 '@/lib/supabase' 导入:"
OLD_IMPORTS=$(grep -r "from.*lib/supabase" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next | grep -v "lib/supabase/admin" | grep -v "lib/supabase/server" | grep -v "lib/supabase/client" | grep -v "verify-updates.sh")

if [ -z "$OLD_IMPORTS" ]; then
  echo "✅ 没有找到旧的 '@/lib/supabase' 导入"
else
  echo "❌ 发现旧的导入:"
  echo "$OLD_IMPORTS"
fi

echo ""
echo "2. 检查是否还有 '@/lib/supabase-browser' 导入:"
BROWSER_IMPORTS=$(grep -r "from.*supabase-browser" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next)

if [ -z "$BROWSER_IMPORTS" ]; then
  echo "✅ 没有找到旧的 '@/lib/supabase-browser' 导入"
else
  echo "❌ 发现旧的浏览器导入:"
  echo "$BROWSER_IMPORTS"
fi

echo ""
echo "3. 检查新的管理员导入:"
ADMIN_IMPORTS=$(grep -r "from.*lib/supabase/admin" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next)
ADMIN_COUNT=$(echo "$ADMIN_IMPORTS" | wc -l | tr -d ' ')
echo "✅ 找到 $ADMIN_COUNT 个文件使用 '@/lib/supabase/admin'"

echo ""
echo "4. 检查新的客户端导入:"
CLIENT_IMPORTS=$(grep -r "from.*lib/supabase/client" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next)
CLIENT_COUNT=$(echo "$CLIENT_IMPORTS" | wc -l | tr -d ' ')
echo "✅ 找到 $CLIENT_COUNT 个文件使用 '@/lib/supabase/client'"

echo ""
echo "5. 检查服务器端导入:"
SERVER_IMPORTS=$(grep -r "from.*lib/supabase/server" . --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.next)
SERVER_COUNT=$(echo "$SERVER_IMPORTS" | wc -l | tr -d ' ')
echo "✅ 找到 $SERVER_COUNT 个文件使用 '@/lib/supabase/server'"

echo ""
echo "=== 详细统计 ==="
echo "管理员导入 (admin.ts): $ADMIN_COUNT 个文件"
echo "客户端导入 (client.ts): $CLIENT_COUNT 个文件" 
echo "服务器端导入 (server.ts): $SERVER_COUNT 个文件"

echo ""
echo "=== 验证完成 ==="
