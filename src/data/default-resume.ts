import type { Language } from "../lib/i18n";

export const DEFAULT_RESUMES: Record<Language, string> = {
  zh: `# 张三

> zhangsan@email.com | 138-0000-0000 | [GitHub](https://github.com/zhangsan) | 上海

## 工作经历

### 高级前端工程师 | ABC科技 | 2022 - 至今

- 主导了公司核心产品的前端架构重构，性能提升 40%
- 带领 5 人前端团队完成 3 个大型项目交付
- 设计并实现了组件库，提升团队开发效率 30%

### 前端工程师 | XYZ公司 | 2019 - 2022

- 负责电商平台的前端开发和维护
- 优化页面加载速度，首屏时间从 3s 降低到 1.2s
- 参与 code review，推动团队代码规范落地

## 教育背景

### 计算机科学与技术 学士 | 某某大学 | 2015 - 2019

- GPA 3.8/4.0，连续三年获得奖学金

## 技能

- **前端：** React, TypeScript, Next.js, Vue, Tailwind CSS, Webpack
- **后端：** Node.js, Express, PostgreSQL
- **工具：** Git, Docker, CI/CD, Linux
- **语言：** 英语（流利）、普通话（母语）

## 开源项目

### [awesome-tool](https://github.com/zhangsan/awesome-tool)

- 一个提升开发效率的 CLI 工具，GitHub 500+ stars
- 使用 TypeScript 编写，发布到 npm
`,
  en: `# Alex Carter

> alex.carter@email.com | (415) 555-0186 | [GitHub](https://github.com/alexcarter) | San Francisco, CA

## Experience

### Senior Frontend Engineer | Northstar Labs | 2022 - Present

- Led a frontend architecture refresh for the company’s flagship product, improving performance by 40%
- Managed a team of 5 frontend engineers and delivered 3 large-scale product launches
- Designed and shipped a shared component system that improved delivery speed by 30%

### Frontend Engineer | Meridian Commerce | 2019 - 2022

- Built and maintained core flows for a high-traffic e-commerce platform
- Reduced first-screen load time from 3.0s to 1.2s through performance tuning
- Contributed to code review standards and raised overall code quality across the team

## Education

### B.S. in Computer Science | Westlake University | 2015 - 2019

- GPA 3.8/4.0, Dean’s Scholarship for three consecutive years

## Skills

- **Frontend:** React, TypeScript, Next.js, Vue, Tailwind CSS, Webpack
- **Backend:** Node.js, Express, PostgreSQL
- **Tooling:** Git, Docker, CI/CD, Linux
- **Languages:** English (Fluent), Mandarin Chinese (Conversational)

## Open Source

### [awesome-tool](https://github.com/alexcarter/awesome-tool)

- A CLI utility focused on developer productivity with 500+ GitHub stars
- Built with TypeScript and published to npm
`,
};

export function getDefaultResume(language: Language): string {
  return DEFAULT_RESUMES[language];
}

export function isDefaultResume(markdown: string): boolean {
  return Object.values(DEFAULT_RESUMES).includes(markdown);
}
