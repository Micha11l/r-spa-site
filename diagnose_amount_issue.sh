#!/bin/bash

# ============================================
# Gift Card 金额显示问题诊断脚本
# ============================================

echo "🔍 开始诊断 Gift Card 金额显示问题..."
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. 检查 API 返回值
# ============================================
echo "📡 步骤 1: 检查 API 返回值"
echo "----------------------------------------"

API_RESPONSE=$(curl -s -X POST http://localhost:3000/api/giftcard/redeem/verify \
  -H "Content-Type: application/json" \
  -d '{
    "token": "387fc8915660c40ce3904a009879d08f"
  }')

API_AMOUNT=$(echo $API_RESPONSE | jq -r '.giftCard.amount')

echo "API 返回的 amount: ${API_AMOUNT}"

if [ "$API_AMOUNT" == "500" ]; then
  echo -e "${GREEN}✅ API 返回正确 (500 dollars)${NC}"
  API_OK=true
else
  echo -e "${RED}❌ API 返回错误，期望 '500'，实际 '${API_AMOUNT}'${NC}"
  API_OK=false
fi

echo ""

# ============================================
# 2. 检查代码中的除法操作
# ============================================
echo "🔎 步骤 2: 搜索可疑的除以 100 操作"
echo "----------------------------------------"

echo "在 app/redeem 中搜索..."
REDEEM_PAGE_DIVS=$(grep -rn "/ 100" app/redeem 2>/dev/null || echo "")

if [ ! -z "$REDEEM_PAGE_DIVS" ]; then
  echo -e "${YELLOW}⚠️ 在 app/redeem 中发现除以 100:${NC}"
  echo "$REDEEM_PAGE_DIVS"
else
  echo -e "${GREEN}✅ app/redeem 中没有发现可疑的除法${NC}"
fi

echo ""
echo "在 components/redeem 中搜索..."
COMPONENT_DIVS=$(grep -rn "/ 100" components/redeem 2>/dev/null || echo "")

if [ ! -z "$COMPONENT_DIVS" ]; then
  echo -e "${YELLOW}⚠️ 在 components/redeem 中发现除以 100:${NC}"
  echo "$COMPONENT_DIVS"
else
  echo -e "${GREEN}✅ components/redeem 中没有发现可疑的除法${NC}"
fi

echo ""

# ============================================
# 3. 检查文件是否存在
# ============================================
echo "📁 步骤 3: 检查关键文件"
echo "----------------------------------------"

files=(
  "app/redeem/[token]/page.tsx"
  "components/redeem/RedeemFlow.tsx"
  "components/redeem/RedeemSuccess.tsx"
  "app/api/giftcard/redeem/verify/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "${GREEN}✅${NC} $file"
  else
    echo -e "${RED}❌${NC} $file (不存在)"
  fi
done

echo ""

# ============================================
# 4. 分析代码模式
# ============================================
echo "🔬 步骤 4: 分析代码模式"
echo "----------------------------------------"

echo "检查 page.tsx 中的数据传递..."
if [ -f "app/redeem/[token]/page.tsx" ]; then
  PAGE_CONVERSION=$(grep -A 5 "initialGiftCard" app/redeem/[token]/page.tsx | grep "/ 100" || echo "")
  
  if [ ! -z "$PAGE_CONVERSION" ]; then
    echo -e "${RED}❌ 发现问题：page.tsx 中进行了除以 100 操作${NC}"
    echo "$PAGE_CONVERSION"
  else
    echo -e "${GREEN}✅ page.tsx 看起来正常${NC}"
  fi
fi

echo ""

echo "检查 RedeemFlow.tsx 中的金额显示..."
if [ -f "components/redeem/RedeemFlow.tsx" ]; then
  COMPONENT_CONVERSION=$(grep -B 2 -A 2 "dollars" components/redeem/RedeemFlow.tsx | grep "/ 100" || echo "")
  
  if [ ! -z "$COMPONENT_CONVERSION" ]; then
    echo -e "${RED}❌ 发现问题：RedeemFlow.tsx 中进行了除以 100 操作${NC}"
    echo "$COMPONENT_CONVERSION"
  else
    echo -e "${GREEN}✅ RedeemFlow.tsx 看起来正常${NC}"
  fi
fi

echo ""

# ============================================
# 5. 总结和建议
# ============================================
echo "============================================"
echo "📊 诊断总结"
echo "============================================"
echo ""

if [ "$API_OK" = true ]; then
  echo -e "${GREEN}✅ API 层正常${NC}"
  echo "   - API 正确返回 dollars 字符串"
  echo ""
fi

if [ ! -z "$REDEEM_PAGE_DIVS" ] || [ ! -z "$COMPONENT_DIVS" ]; then
  echo -e "${RED}⚠️ 发现问题源头${NC}"
  echo "   - 在前端代码中发现了额外的除以 100 操作"
  echo "   - 这导致了双重转换：500 → 5.00 → 显示为 $0.05"
  echo ""
  echo "🔧 修复建议："
  echo "   1. 检查上面列出的文件和行号"
  echo "   2. 移除额外的 '/ 100' 操作"
  echo "   3. API 已经返回 dollars，前端只需要格式化显示"
  echo ""
  echo "   正确的做法："
  echo "   ${GREEN}parseFloat(giftCard.dollars).toFixed(2)${NC}"
  echo ""
  echo "   错误的做法："
  echo "   ${RED}(parseFloat(giftCard.dollars) / 100).toFixed(2)${NC}"
  echo ""
else
  echo -e "${YELLOW}⚠️ 未找到明显的除法操作${NC}"
  echo "   可能问题在于："
  echo "   1. 数据传递过程中字段名混淆"
  echo "   2. 使用了格式化函数但配置错误"
  echo "   3. 类型转换问题"
  echo ""
  echo "🔧 建议添加调试日志："
  echo "   在组件中添加："
  echo "   ${GREEN}console.log('Gift Card:', giftCard);${NC}"
  echo "   ${GREEN}console.log('Amount:', parseFloat(giftCard.dollars));${NC}"
fi

echo ""
echo "============================================"
echo "🎯 下一步行动"
echo "============================================"
echo ""
echo "1. 查看上面标记的 ${RED}❌${NC} 和 ${YELLOW}⚠️${NC} 项"
echo "2. 根据建议修改相应的代码"
echo "3. 运行 'npm run dev' 重启开发服务器"
echo "4. 访问 http://localhost:3000/redeem/387fc8915660c40ce3904a009879d08f"
echo "5. 验证显示是否正确为 \$500.00"
echo ""
echo "需要更详细的帮助？查看 AMOUNT_DISPLAY_FIX.md"
echo ""
