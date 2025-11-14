// app/api/classes/manage/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/classes/manage - 获取课程管理数据
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const class_date = searchParams.get("date");
    const class_type = searchParams.get("type");

    // 简化权限：能访问这个API就是管理员（因为admin页面有passcode保护）
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    // 构建查询
    let query = supabaseAdmin
      .from("class_signups")
      .select("*")
      .order("class_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (class_date) {
      query = query.eq("class_date", class_date);
    }

    if (class_type) {
      query = query.eq("class_type", class_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[classes/manage] Query failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 按课程分组统计
    const grouped: Record<string, any> = {};
    
    for (const signup of data || []) {
      const key = `${signup.class_type}_${signup.class_date}_${signup.start_time}_${signup.end_time}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          class_type: signup.class_type,
          class_date: signup.class_date,
          start_time: signup.start_time,
          end_time: signup.end_time,
          participants: [],
          count: 0
        };
      }
      
      grouped[key].participants.push({
        id: signup.id,
        user_id: signup.user_id,
        email: signup.email,
        full_name: signup.full_name,
        created_at: signup.created_at
      });
      grouped[key].count++;
    }

    // 获取每个课程的容量设置
    const classes = Object.values(grouped);
    
    // 批量获取容量
    if (classes.length > 0) {
      const capacityConditions = classes.map(c => ({
        class_type: c.class_type,
        class_date: c.class_date,
        start_time: c.start_time,
        end_time: c.end_time
      }));

      // 使用 or 查询获取所有容量
      const { data: capacityData } = await supabaseAdmin
        .from("class_capacity")
        .select("class_type,class_date,start_time,end_time,max_capacity");

      // 构建容量映射
      const capacityMap: Record<string, number> = {};
      for (const cap of capacityData || []) {
        const key = `${cap.class_type}_${cap.class_date}_${cap.start_time}_${cap.end_time}`;
        capacityMap[key] = cap.max_capacity;
      }

      // 为每个课程添加容量
      for (const cls of classes) {
        const key = `${cls.class_type}_${cls.class_date}_${cls.start_time}_${cls.end_time}`;
        cls.capacity = capacityMap[key] ?? 5; // 默认5
      }
    }

    return NextResponse.json({ classes });
  } catch (err: any) {
    console.error("[classes/manage] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/classes/manage - 更新课程capacity或发送提醒
export async function POST(req: Request) {
  try {
    const { action, class_type, class_date, start_time, end_time, capacity, emails } = await req.json();

    // 简化权限验证
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth header" }, { status: 401 });
    }

    // ==================
    // 发送提醒邮件
    // ==================
    if (action === "send_reminder" && emails) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/class-reminder`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": authHeader 
        },
        body: JSON.stringify({
          emails,
          class_type,
          class_date,
          start_time,
          end_time
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send reminder emails");
      }

      return NextResponse.json({ message: "Reminders sent successfully" });
    }

    // ==================
    // 更新课程容量
    // ==================
    if (action === "update_capacity") {
      if (!capacity || capacity < 1) {
        return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });
      }

      const { error } = await supabaseAdmin
        .from("class_capacity")
        .upsert({
          class_type,
          class_date,
          start_time,
          end_time,
          max_capacity: capacity,
          updated_at: new Date().toISOString()
        }, {
          onConflict: "class_type,class_date,start_time,end_time"
        });

      if (error) {
        console.error("[classes/manage] Capacity update failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: "Capacity updated successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("[classes/manage] Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
