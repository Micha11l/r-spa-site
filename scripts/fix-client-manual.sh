#!/bin/bash

echo "开始手动修复客户端组件..."

# 创建临时修复文件
fix_file() {
  local file=$1
  local line=$2
  local content=$3
  
  echo "修复 $file 第 $line 行"
  cp "$file" "$file.bak"
  
  # 使用 awk 来精确修复特定行
  awk -v line="$line" -v new_content="$content" '
  NR == line { print new_content; next }
  { print }
  ' "$file.bak" > "$file"
}

# 修复 app/account/page.tsx 第37行
fix_file "./app/account/page.tsx" 37 "  const supabase = createClient();"

# 修复 components/AuthCard.tsx 第27行
fix_file "./components/AuthCard.tsx" 27 "    const sb = createClient(); // ✅ 调用函数，得到 SupabaseClient"

# 修复 components/AuthCard.tsx 第60行  
fix_file "./components/AuthCard.tsx" 60 "    const sb = createClient(); // ✅ 这里也要调用"

# 修复 components/Navbar.tsx 第31行
fix_file "./components/Navbar.tsx" 31 "  const supabase = useMemo(() => createClient(), []);"

# 修复 components/SignInForm.tsx 第7行
fix_file "./components/SignInForm.tsx" 7 "  const supabase = createClient();"

# 修复 components/SignUpForm.tsx 第26行
fix_file "./components/SignUpForm.tsx" 26 "  const supabase = createClient();"

echo "修复完成！备份文件已创建为 .bak 文件"
