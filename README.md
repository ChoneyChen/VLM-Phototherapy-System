# VLM Phototherapy System

生产级多用户面部皮肤识别、治疗方案生成与智能光疗面罩控制系统。

本项目面向“云端视觉模型 + 结构化面部识别 + 档案驱动治疗方案 + 智能硬件预留接口”的场景，目标是把面部识别、治疗策略、控制会话和治疗记录拆成清晰的独立层，便于后续持续增强诊疗知识库与接入真实设备。

## 1. 当前实现了什么

### 1.1 已交付功能

- 多用户管理，自动分配业务 ID，格式为 `USR-0001`
- 进入系统前先选择用户或创建用户
- 支持两类视觉识别模型
  - `gemini`
  - `qwen`
- 支持两类图像输入方式
  - 本地上传
  - 浏览器摄像头拍照
- 输出结构化面部测评结果
  - 整体皮肤状态
  - 分区问题
  - 严重程度
  - 双语简述
  - 测评阶段建议
- 自动归档每日图像与测评结果
- 档案时间线浏览与删除
- 从历史档案独立生成治疗方案
- 治疗方案与面部识别正式解耦
- 智能光疗面罩治疗控制页
  - 简笔画人脸区域点击
  - 分区 LED 颜色调节
  - 全局亮度调节
  - 全局温度调节
  - 全局加湿频率调节
  - 全局定时调节
  - 开始 / 暂停 / 恢复治疗
- 治疗记录页
  - 记录启动时间
  - 记录时长
  - 记录关联方案
  - 记录控制快照与状态
- 中英文切换
  - 英文为主模式
  - 中文模式页面和模型文本均显示中文
  - 内部标准码保持英文稳定
- 后端可脱离前端独立运行

### 1.2 当前业务分成四段

1. 面部测评 `assessment`
2. 面部档案 `archive`
3. 治疗方案 `treatment plan`
4. 治疗控制与治疗记录 `treatment control / treatment records`

最重要的当前调整是：

- 面部识别负责提取信息
- 治疗方案由历史档案单独触发生成
- 治疗控制负责智能面罩参数编辑
- 治疗记录负责保存当次执行快照

## 2. 页面结构

当前左侧导航共有六个主页面：

1. `Face Assessment / 面部测评`
2. `Face Archive / 面部档案`
3. `Treatment Plan / 治疗方案`
4. `Treatment Control / 治疗控制`
5. `Treatment Records / 治疗记录`
6. `Users / 用户`

页面关系如下：

- 面部测评用于新增档案
- 面部档案用于查看历史识别结果，并触发“新增治疗方案”
- 治疗方案用于查看已生成的方案卡，并进入治疗控制
- 治疗控制用于编辑智能面罩控制参数并开始/暂停治疗
- 治疗记录用于查看历史治疗执行快照
- 用户页用于创建、切换和删除用户

## 3. 核心业务逻辑

### 3.1 面部测评逻辑

面部测评阶段保持原有功能不变。

它负责：

- 接收图像
- 调用视觉模型
- 识别整体状态
- 识别八个标准分区
- 输出结构化信息
- 归档到数据库和文件系统

标准分区固定为：

- `Forehead Zone`
- `Periorbital Zone`
- `Nasal Zone`
- `Left Malar Zone`
- `Right Malar Zone`
- `Perioral Zone`
- `Mandibular/Chin Zone`
- `Jawline Zone`

严重度固定为：

- `low`
- `medium`
- `high`

### 3.2 治疗方案逻辑

治疗方案不再在面部测评时直接生成。

现在的逻辑是：

1. 面部测评先沉淀为历史档案
2. 用户在档案页选中某份历史档案
3. 点击“新增治疗方案”
4. 前端显示假进度条
5. 后端读取该档案、资料库与设备画像
6. 后端调用 `qwen-plus`
7. 生成一条结构化治疗方案

治疗方案页现在只展示：

- 整体严重性
- 来源档案
- 分区与对应问题

治疗方案页不直接展示详细控制参数，不在这里做硬件编辑。

### 3.3 智能面罩治疗控制逻辑

当前硬件抽象已经改为“整体智能光疗面罩”。

控制逻辑如下：

- 每个面部区域单独控制 `LED` 颜色
- 加热是全局参数
- 加湿是全局参数
- 亮度是全局参数
- 定时是全局参数

当前前端控制方式：

- 颜色：七色选项
  - `red`
  - `orange`
  - `yellow`
  - `green`
  - `cyan`
  - `blue`
  - `purple`
- 温度：离散滑动条
  - 范围 `20-40`
  - 步进 `1`
- 亮度：滑动条
- 加湿频率：滑动条
- 定时：滑动条

### 3.4 治疗记录逻辑

开始治疗后，系统会创建一条治疗记录。

记录内容包括：

- 记录 ID
- 用户 ID
- 关联治疗方案 ID
- 方案摘要
- 严重性
- 当前状态
- 启动时长
- 启动时的全局控制参数
- 启动时的分区 LED 设置

这为后续接入真实硬件执行回执打下了基础。

## 4. 架构设计

### 4.1 设计原则

本项目严格遵守以下原则：

- 前后端彻底分离
- 业务规则和协议结构集中在后端
- 页面层不直接拼硬件协议
- 所有修改必须先从前端、后端、共享合同三侧统筹规划
- 多语言显示与内部标准码分离
- 模型自由文本不得直接充当硬件控制字段

### 4.2 分层结构

#### `backend/`

后端服务和 CLI。

负责：

- HTTP API
- 业务规则
- 数据库存储
- 图像归档
- 模型调用
- 治疗方案生成
- 智能面罩控制会话生成
- 治疗记录落库
- 硬件协议抽象

#### `frontend/`

React 前端。

负责：

- 页面渲染
- 路由切换
- 用户交互
- 本地 UI 状态
- API 调用
- 多语言显示

#### `common/`

前后端共享资产目录。

负责：

- 结构化合同
- 提示词模板
- 皮肤知识分类
- 诊疗资料库
- 设备画像

#### `docs/`

项目文档目录。

负责：

- 对外接口说明
- 联调说明
- 后续扩展的专题文档

### 4.3 关键架构决策

#### 决策一：面部识别与治疗方案解耦

这样做的好处：

- 档案是稳定事实层
- 方案是可迭代策略层
- 后续可以在不重跑识别的前提下迭代治疗逻辑
- 可以逐步引入临床资料库和案例记忆库

#### 决策二：治疗方案与治疗控制解耦

治疗方案只回答“建议做什么”，治疗控制只回答“本次实际怎样控制”。

这样做的好处：

- 不把页面编辑值写回方案本身
- 控制快照可单独归档
- 后续真实设备接口更稳定

#### 决策三：治疗记录独立建模

这样做的好处：

- 可以追踪一次治疗真实使用了哪些参数
- 可以扩展开始、暂停、恢复、完成等状态
- 可以接设备回执和审计日志

## 5. 文件组织

当前核心目录如下：

```text
VLM-Phototherapy-System/
├─ .env
├─ ARCHITECTURE.md
├─ README.md
├─ start-dev.bat
├─ start-dev.ps1
├─ backend/
│  ├─ pyproject.toml
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ deps.py
│  │  │  └─ routers/
│  │  │     ├─ health.py
│  │  │     ├─ users.py
│  │  │     ├─ assessments.py
│  │  │     ├─ treatment_plans.py
│  │  │     ├─ treatment_control.py
│  │  │     └─ treatment_records.py
│  │  ├─ core/
│  │  ├─ domain/
│  │  │  ├─ catalog.py
│  │  │  └─ services/
│  │  │     ├─ user_service.py
│  │  │     ├─ assessment_service.py
│  │  │     ├─ treatment_plan_service.py
│  │  │     ├─ treatment_control_service.py
│  │  │     └─ treatment_record_service.py
│  │  ├─ infrastructure/
│  │  │  ├─ db/
│  │  │  ├─ hardware/
│  │  │  ├─ llm/
│  │  │  └─ storage/
│  │  ├─ schemas/
│  │  │  ├─ user.py
│  │  │  ├─ assessment.py
│  │  │  ├─ treatment_plan.py
│  │  │  ├─ control.py
│  │  │  └─ treatment_record.py
│  │  ├─ cli.py
│  │  └─ main.py
│  ├─ data/
│  │  ├─ archive/
│  │  └─ runtime/
│  └─ tests/
├─ common/
│  ├─ contracts/
│  │  ├─ skin_assessment_contract.json
│  │  ├─ treatment_plan_contract.json
│  │  ├─ treatment_control_contract.json
│  │  └─ treatment_record_contract.json
│  ├─ knowledge/
│  │  ├─ skin_taxonomy.json
│  │  ├─ treatment_case_samples.json
│  │  └─ treatment_plan_library/
│  │     ├─ authoring_notes.md
│  │     ├─ case_memory.json
│  │     ├─ clinical_guidelines.md
│  │     └─ mask_device_profile.json
│  └─ prompts/
│     ├─ skin_assessment_system_prompt.md
│     └─ treatment_plan_generation_prompt.md
├─ docs/
│  └─ API.md
└─ frontend/
   ├─ package.json
   └─ src/
      ├─ app/
      ├─ features/
      ├─ pages/
      └─ shared/
```

## 6. 模型与资料库

### 6.1 面部识别模型

当前支持：

- `gemini`
  - 默认模型：`gemini-3-flash-preview`
  - 使用 `google-genai`
  - 可配置代理
- `qwen`
  - 默认模型：`qwen3.5-flash`
  - 使用 DashScope OpenAI 兼容接口

### 6.2 治疗方案生成模型

当前固定使用：

- `qwen-plus`

它与 `qwen3.5-flash` 使用同一个 DashScope API Key 和 Base URL。

### 6.3 诊疗资料库预留

当前已经创建供后续持续补充的资料库目录：

- `common/knowledge/treatment_plan_library/case_memory.json`
- `common/knowledge/treatment_plan_library/mask_device_profile.json`
- `common/knowledge/treatment_plan_library/clinical_guidelines.md`
- `common/knowledge/treatment_plan_library/authoring_notes.md`

后续你主要可以往这里补：

- 案例样本
- 诊疗原则
- 禁忌与边界
- 不同问题类型到 LED 颜色的经验映射
- 不同严重度下的温度/亮度/时长基线

## 7. 环境要求

### 7.1 基础环境

- Python `3.12.x`
- Node.js `18+`
- npm

### 7.2 Python 虚拟环境

项目使用根目录 `.venv`。

如果还未创建：

```powershell
py -3.12 -m venv .venv
```

激活：

```powershell
.venv\Scripts\Activate.ps1
```

### 7.3 后端依赖

后端定义在 `backend/pyproject.toml` 中，核心包括：

- `fastapi`
- `uvicorn`
- `sqlalchemy`
- `google-genai`
- `openai`
- `typer`
- `python-multipart`
- `pydantic-settings`

### 7.4 前端依赖

前端定义在 `frontend/package.json` 中，核心包括：

- `react`
- `react-dom`
- `react-router-dom`
- `typescript`
- `vite`

## 8. 环境变量

所有密钥统一放在根目录 `.env`。

示例：

```env
APP_ENV=development
APP_NAME=VLM Phototherapy System
API_PREFIX=/api
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL_NAME=gemini-3-flash-preview
GEMINI_PROXY_URL=http://127.0.0.1:7890

DASHSCOPE_API_KEY=your_dashscope_key
QWEN_MODEL_NAME=qwen3.5-flash
QWEN_PLUS_MODEL_NAME=qwen-plus
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1

DATABASE_URL=sqlite:///.../backend/data/runtime/vlm_phototherapy_app.db
```

关键说明：

- `GEMINI_PROXY_URL` 用于 Gemini 代理
- `DASHSCOPE_API_KEY` 同时供 `qwen3.5-flash` 和 `qwen-plus` 使用
- `QWEN_PLUS_MODEL_NAME` 控制治疗方案生成模型

## 9. 安装与启动

### 9.1 一键启动

推荐直接使用根目录脚本：

```powershell
.\start-dev.ps1
```

或双击：

```text
start-dev.bat
```

脚本会自动：

- 检查并创建 `.venv`
- 安装后端依赖
- 必要时安装前端依赖
- 分别打开前后端开发窗口

### 9.2 手动启动后端

```powershell
.venv\Scripts\Activate.ps1
cd backend
python -m app.main
```

默认地址：

- `http://127.0.0.1:8000`

### 9.3 手动启动前端

```powershell
cd frontend
npm install
npm run dev
```

默认地址：

- `http://127.0.0.1:5173`

## 10. 数据存储

### 10.1 SQLite

默认数据库位于：

```text
backend/data/runtime/vlm_phototherapy_app.db
```

当前主要存储：

- 用户
- 面部测评
- 分区观测
- 治疗方案
- 治疗记录

### 10.2 图像归档

原始图片归档目录：

```text
backend/data/archive/
```

### 10.3 文件访问

归档图片通过：

```text
/files/<relative_path>
```

进行访问。

## 11. API 说明

完整 API 文档已经拆分到：

- `docs/API.md`

其中包含：

- 接口总览
- 请求与响应结构
- 状态码
- 错误格式
- PowerShell 调用示例
- 从档案到方案到控制到记录的联调流程

## 12. CLI 使用

后端可以在没有前端的情况下独立运行。

### 12.1 列出用户

```powershell
.venv\Scripts\Activate.ps1
cd backend
python -m app.cli users list
```

### 12.2 创建用户

```powershell
python -m app.cli users create --name "Alice" --notes "sensitive skin"
```

### 12.3 提交一次面部测评

```powershell
python -m app.cli assess `
  --user USR-0001 `
  --image "C:\path\face.jpg" `
  --provider gemini `
  --language en `
  --notes "frontal image under daylight"
```

CLI 当前仍然主要覆盖用户和测评链路。治疗方案与治疗控制的 CLI 后续可以继续补充。

## 13. 当前前端工作流

### 13.1 新建档案

1. 选择用户
2. 上传图片或打开摄像头拍照
3. 选择视觉模型
4. 提交识别
5. 查看结果并归档

### 13.2 从档案生成治疗方案

1. 打开面部档案页
2. 选中一条历史档案
3. 点击右上角双点菜单
4. 选择“新增治疗方案”
5. 等待假进度条结束
6. 进入治疗方案页

### 13.3 从治疗方案进入治疗控制

1. 打开治疗方案页
2. 点击某张方案卡
3. 进入治疗控制页
4. 编辑面罩参数
5. 启动或暂停治疗

### 13.4 查看治疗记录

1. 打开治疗记录页
2. 查看时间、时长、状态和关联方案
3. 追溯当次控制快照

## 14. 硬件接口预留

### 14.1 当前预留了哪些接口

智能面罩控制协议当前主要预留：

- 分区 LED 颜色
- 全局亮度
- 全局温度
- 全局加湿频率
- 全局定时
- 执行通道

### 14.2 当前为什么还不能直接控制硬件

因为目前尚未确定：

- 真实设备通信方式
- 设备参数名称
- 设备回执格式
- 设备错误码
- 设备端状态机

所以当前系统只做到：

- 页面结构就位
- 后端协议就位
- 记录层就位
- Mock 控制器就位

### 14.3 后续如何接硬件

推荐按以下顺序扩展：

1. 明确设备通信协议
2. 在 `backend/app/infrastructure/hardware/` 增加真实控制器实现
3. 将 `mask_control.v1` 映射为设备命令
4. 增加设备执行结果回写
5. 在治疗记录中增加设备侧状态字段

## 15. 后续怎么继续用

### 15.1 作为当前演示系统使用

你现在可以直接：

1. 启动前后端
2. 创建用户
3. 上传或拍照
4. 形成档案
5. 从档案生成治疗方案
6. 进入治疗控制
7. 查看治疗记录

### 15.2 作为后续诊疗知识库底座

你后续可以主要维护：

- `common/knowledge/treatment_plan_library/case_memory.json`
- `common/knowledge/treatment_plan_library/clinical_guidelines.md`

通过这些文件持续增强方案生成质量，而不需要改动前端页面结构。

### 15.3 作为未来硬件系统的软件底座

当前架构已经适合作为后续智能面罩设备的控制软件底座，因为：

- 面部识别层独立
- 方案层独立
- 控制层独立
- 记录层独立

## 16. 后续建议优先级

建议后续按下面顺序继续推进：

1. 扩充诊疗资料库和案例库
2. 给治疗方案增加版本管理
3. 给治疗控制增加“完成治疗”和“停止治疗”
4. 接入真实硬件控制器
5. 增加设备回执与异常记录
6. 增加审计日志和监控

## 17. 相关文档

- 架构规范：[ARCHITECTURE.md](./ARCHITECTURE.md)
- API 文档：[docs/API.md](./docs/API.md)
- 面部测评合同：`common/contracts/skin_assessment_contract.json`
- 治疗方案合同：`common/contracts/treatment_plan_contract.json`
- 治疗控制合同：`common/contracts/treatment_control_contract.json`
- 治疗记录合同：`common/contracts/treatment_record_contract.json`
- 治疗方案提示词：`common/prompts/treatment_plan_generation_prompt.md`
- 诊疗资料库目录：`common/knowledge/treatment_plan_library/`

## 18. 当前状态总结

这个项目现在已经不只是“面部识别 demo”，而是一个完整的分层原型：

- 有稳定的档案事实层
- 有独立的治疗方案生成层
- 有面向智能面罩的控制层
- 有可追溯的治疗记录层

它当前最适合作为：

- 生产级原型
- 智能光疗面罩的软件底座
- 面部皮肤状态与治疗策略研究平台
