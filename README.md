# OnTheWay

前端 Onboarding SaaS - 基于 Driver.js 的可视化引导工具

## 功能

- 🎯 可视化录制引导步骤
- 📝 在线编辑文案和位置
- 🚀 一行代码集成到任何网站
- 📊 引导完成率统计

## 技术栈

- Next.js 15 + React 19
- Supabase (Auth + Database)
- Driver.js (引导核心)
- Tailwind CSS

## 开发

```bash
pnpm install
pnpm dev
```

## 架构

```
src/
├── app/              # Next.js App Router
│   ├── dashboard/    # 控制台
│   └── api/          # API 路由
├── components/       # UI 组件
├── lib/
│   ├── supabase/     # Supabase 客户端
│   └── sdk/          # 客户端 SDK 源码
└── types/            # TypeScript 类型
```

## SDK 使用

```html
<script src="https://ontheway.zoe.im/sdk.js" data-project="your-project-id"></script>
<script>
  // 自动执行 auto 触发的任务
  // 或手动触发
  ontheway.start('task-id')
</script>
```
