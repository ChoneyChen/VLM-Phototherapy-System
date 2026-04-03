# API Documentation

VLM Phototherapy System 的独立接口文档。

本文档面向：

- 前端联调
- 后端维护
- 自动化测试
- 第三方系统集成
- 后续智能面罩硬件对接

当前版本的核心业务链路是：

1. 用户
2. 面部测评
3. 历史档案
4. 治疗方案
5. 治疗控制
6. 治疗记录

其中最重要的当前约束是：

- 面部测评只负责识别与提取信息
- 治疗方案必须从历史档案单独生成
- 治疗控制只消费治疗方案，不直接消费测评结果
- 治疗记录保存执行时的控制快照

---

## 1. 基础信息

### 1.1 Base URLs

本地开发默认地址：

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:8000`
- API Base: `http://127.0.0.1:8000/api`

### 1.2 Interactive Docs

FastAPI 自动文档：

- Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc: `http://127.0.0.1:8000/redoc`

### 1.3 Auth

当前版本未启用鉴权，适用于本地开发和内部联调。

后续如需接入鉴权，建议优先增加：

- API Gateway
- JWT / Session
- 设备执行 token

而不是修改当前业务 JSON 结构。

---

## 2. 通用约定

### 2.1 Content Types

- JSON 请求：`application/json`
- 文件上传：`multipart/form-data`
- 静态文件：二进制文件响应

### 2.2 时间格式

所有时间字段均为后端返回的 ISO 8601 风格时间戳。

常见字段：

- `created_at`
- `captured_at`
- `updated_at`

### 2.3 业务 ID 约定

- 用户：`USR-0001`
- 测评：`ASM-xxxxxxxxxxxx`
- 治疗方案：`TPL-xxxxxxxxxxxx`
- 治疗记录：`REC-xxxxxxxxxxxx`

### 2.4 多语言约定

内部结构化字段统一使用英文标准码。

可读文本使用双语结构：

```json
{
  "en": "string",
  "zh": "string"
}
```

### 2.5 严重度枚举

- `low`
- `medium`
- `high`

### 2.6 面部识别模型枚举

- `gemini`
- `qwen`

### 2.7 治疗方案生成模型

当前治疗方案服务内部固定使用：

- `qwen_plus`

---

## 3. 错误格式

### 3.1 通用业务错误

```json
{
  "detail": "Assessment not found."
}
```

### 3.2 参数校验错误

FastAPI 会返回标准 422 结构，例如：

```json
{
  "detail": [
    {
      "type": "missing",
      "loc": ["body", "assessment_id"],
      "msg": "Field required",
      "input": {}
    }
  ]
}
```

### 3.3 常见状态码

- `200 OK`：查询成功、预设生成成功、状态更新成功
- `201 Created`：新资源创建成功
- `204 No Content`：删除成功
- `400 Bad Request`：业务参数不合法
- `404 Not Found`：资源不存在
- `422 Unprocessable Entity`：请求结构校验失败
- `500 Internal Server Error`：未处理异常

---

## 4. 公共数据模型

### 4.1 LocalizedText

```json
{
  "en": "Mixed skin condition",
  "zh": "混合型皮肤表现"
}
```

### 4.2 LocalizedStringList

```json
{
  "en": ["Hydration support", "Barrier comfort"],
  "zh": ["补水支持", "屏障舒缓"]
}
```

### 4.3 UserRead

| Field | Type | Description |
| --- | --- | --- |
| `public_id` | `string` | 用户业务 ID |
| `sequence_number` | `integer` | 顺序编号 |
| `name` | `string` | 用户名称 |
| `notes` | `string \| null` | 用户备注 |
| `created_at` | `datetime` | 创建时间 |

### 4.4 AssessmentListItem

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | 测评 ID |
| `user_public_id` | `string` | 用户业务 ID |
| `model_provider` | `gemini \| qwen` | 识别模型 |
| `analysis_language` | `en \| zh` | 本次分析语言 |
| `overall_condition_texts` | `LocalizedText` | 整体状态 |
| `overall_severity` | `low \| medium \| high` | 整体严重度 |
| `overall_summary_texts` | `LocalizedText` | 整体总结 |
| `image_path` | `string` | 归档图片相对路径 |
| `captured_at` | `datetime` | 归档时间 |

### 4.5 ZoneAssessment

| Field | Type | Description |
| --- | --- | --- |
| `zone_name` | `string` | 标准分区名 |
| `issue_category_code` | `string` | 问题类别标准码 |
| `severity` | `low \| medium \| high` | 分区严重度 |
| `summary_texts` | `LocalizedText` | 分区简述 |
| `treatment_plan` | `AssessmentTreatmentPlan` | 测评阶段建议性治疗字段 |

说明：

- 该 `treatment_plan` 仍保留在测评响应中，便于临床阅读和兼容旧链路
- 它不是当前智能面罩真实控制输入
- 真正的控制链路必须走 `treatment-plans -> treatment-control -> treatment-records`

### 4.6 AssessmentTreatmentPlan

| Field | Type | Description |
| --- | --- | --- |
| `light_type_code` | `string` | 建议光类型 |
| `temperature_celsius` | `integer` | 建议温度 |
| `duration_minutes` | `integer` | 建议时长 |
| `humidification_enabled` | `boolean` | 建议是否加湿 |
| `notes_texts` | `LocalizedText` | 说明文本 |
| `hardware_profile` | `HardwareProfile` | 建议性硬件结构 |

### 4.7 HardwareProfile

| Field | Type | Description |
| --- | --- | --- |
| `schema_version` | `string` | 当前为 `phototherapy_command.v1` |
| `execution_channel` | `string` | 当前为保留值 |
| `zone_code` | `string` | 分区名 |
| `light_type_code` | `string` | 光类型标准码 |
| `temperature_celsius` | `integer` | 温度 |
| `duration_minutes` | `integer` | 时长 |
| `humidification_enabled` | `boolean` | 是否加湿 |
| `safety_profile` | `object` | 温度与时长范围 |

### 4.8 TreatmentPlanZone

| Field | Type | Description |
| --- | --- | --- |
| `zone_name` | `string` | 标准分区名 |
| `issue_category_code` | `string` | 问题类别 |
| `severity` | `low \| medium \| high` | 严重度 |
| `led_color_code` | `red \| orange \| yellow \| green \| cyan \| blue \| purple` | 分区 LED 颜色建议 |
| `notes_texts` | `LocalizedText` | 分区治疗说明 |

### 4.9 GlobalMaskSettings

| Field | Type | Description |
| --- | --- | --- |
| `brightness_percent` | `integer` | 全局亮度 |
| `temperature_celsius` | `integer` | 全局温度 |
| `humidification_frequency_level` | `integer` | 全局加湿频率 |
| `timer_minutes` | `integer` | 全局定时 |

### 4.10 TreatmentPlanListItem

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | 治疗方案 ID |
| `user_public_id` | `string` | 用户业务 ID |
| `assessment_id` | `string` | 来源档案 ID |
| `planner_model_provider` | `qwen_plus` | 方案生成模型 |
| `overall_severity` | `low \| medium \| high` | 整体严重度 |
| `summary_texts` | `LocalizedText` | 方案摘要 |
| `zones` | `TreatmentPlanZone[]` | 分区与问题摘要 |
| `created_at` | `datetime` | 生成时间 |

### 4.11 TreatmentPlanDetail

在 `TreatmentPlanListItem` 基础上新增：

| Field | Type | Description |
| --- | --- | --- |
| `rationale_texts` | `LocalizedText` | 方案说明 |
| `global_settings` | `GlobalMaskSettings` | 推荐全局参数 |

### 4.12 TreatmentControlOptionsResponse

| Field | Type | Description |
| --- | --- | --- |
| `mask_zone_codes` | `string[]` | 面罩分区列表 |
| `light_color_codes` | `string[]` | 可选 LED 颜色 |
| `brightness_percent` | `NumericControlOption` | 亮度范围 |
| `temperature_celsius` | `NumericControlOption` | 温度范围 |
| `humidification_frequency_level` | `NumericControlOption` | 加湿频率范围 |
| `timer_minutes` | `NumericControlOption` | 定时范围 |

### 4.13 TreatmentControlSessionResponse

| Field | Type | Description |
| --- | --- | --- |
| `schema_version` | `string` | 当前为 `mask_control.v1` |
| `execution_channel` | `string` | 当前为 `reserved` |
| `treatment_plan_id` | `string` | 来源治疗方案 |
| `user_public_id` | `string` | 用户业务 ID |
| `overall_severity` | `low \| medium \| high` | 整体严重度 |
| `summary_texts` | `LocalizedText` | 方案摘要 |
| `global_settings` | `GlobalMaskSettings` | 全局控制起始值 |
| `zone_led_settings` | `ZoneLedSetting[]` | 每个分区的 LED 配置 |

### 4.14 TreatmentRecordRead

| Field | Type | Description |
| --- | --- | --- |
| `id` | `string` | 治疗记录 ID |
| `user_public_id` | `string` | 用户业务 ID |
| `treatment_plan_id` | `string` | 关联治疗方案 ID |
| `plan_summary_texts` | `LocalizedText` | 方案摘要 |
| `overall_severity` | `low \| medium \| high` | 整体严重度 |
| `status` | `running \| paused \| completed` | 当前状态 |
| `timer_minutes` | `integer` | 启动时长 |
| `created_at` | `datetime` | 创建时间 |
| `updated_at` | `datetime` | 更新时间 |
| `global_settings` | `GlobalMaskSettings` | 启动时的全局参数快照 |
| `zone_led_settings` | `ZoneLedSetting[]` | 启动时的分区 LED 快照 |

---

## 5. 接口总览

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | 健康检查 |
| `GET` | `/api/users` | 列出用户 |
| `POST` | `/api/users` | 创建用户 |
| `GET` | `/api/users/{user_public_id}` | 获取单个用户 |
| `DELETE` | `/api/users/{user_public_id}` | 删除用户 |
| `GET` | `/api/users/{user_public_id}/assessments` | 获取用户档案摘要列表 |
| `POST` | `/api/assessments` | 创建一次面部测评 |
| `GET` | `/api/assessments/{assessment_id}` | 获取测评详情 |
| `DELETE` | `/api/assessments/{assessment_id}` | 删除测评 |
| `GET` | `/api/treatment-plans` | 按用户获取治疗方案列表 |
| `POST` | `/api/treatment-plans` | 从档案生成治疗方案 |
| `GET` | `/api/treatment-plans/{plan_id}` | 获取治疗方案详情 |
| `GET` | `/api/treatment-control/options` | 获取智能面罩控制范围 |
| `POST` | `/api/treatment-control/preset` | 根据治疗方案生成控制会话 |
| `GET` | `/api/treatment-records` | 按用户获取治疗记录 |
| `POST` | `/api/treatment-records` | 创建治疗记录 |
| `PATCH` | `/api/treatment-records/{record_id}/status` | 更新治疗记录状态 |
| `GET` | `/files/{relative_path}` | 获取归档图片 |

---

## 6. Health API

### 6.1 `GET /health`

服务存活检查。

#### Response

`200 OK`

```json
{
  "status": "ok"
}
```

---

## 7. User APIs

### 7.1 `GET /api/users`

返回所有用户。

#### Response

`200 OK`

```json
[
  {
    "public_id": "USR-0001",
    "sequence_number": 1,
    "name": "Alice",
    "notes": "sensitive skin",
    "created_at": "2026-04-02T09:30:00Z"
  }
]
```

### 7.2 `POST /api/users`

创建用户。

#### Request Body

```json
{
  "name": "Alice",
  "notes": "sensitive skin"
}
```

#### Success Response

`201 Created`

### 7.3 `GET /api/users/{user_public_id}`

获取单个用户。

#### Error Responses

- `404 Not Found`

### 7.4 `DELETE /api/users/{user_public_id}`

删除用户。

说明：

- 会级联删除该用户的档案、治疗方案和治疗记录

#### Success Response

`204 No Content`

### 7.5 `GET /api/users/{user_public_id}/assessments`

获取某个用户的历史测评摘要列表。

#### Query Params

| Name | Type | Required | Default |
| --- | --- | --- | --- |
| `limit` | `integer` | No | `30` |

#### Success Response

`200 OK`

```json
[
  {
    "id": "ASM-80b4f9a758c7",
    "user_public_id": "USR-0001",
    "model_provider": "gemini",
    "analysis_language": "en",
    "overall_condition_texts": {
      "en": "Mixed skin condition",
      "zh": "混合型皮肤表现"
    },
    "overall_severity": "medium",
    "overall_summary_texts": {
      "en": "Visible dryness and tone irregularity.",
      "zh": "可见干燥与肤色不均。"
    },
    "image_path": "archive/USR-0001/ASM-80b4f9a758c7/face.jpg",
    "captured_at": "2026-04-02T10:00:00Z"
  }
]
```

---

## 8. Assessment APIs

### 8.1 `POST /api/assessments`

创建一次面部测评。

该接口会：

1. 校验用户和模型参数
2. 保存上传图片
3. 调用视觉模型
4. 归一化结果
5. 写入数据库
6. 返回完整测评详情

#### Content Type

`multipart/form-data`

#### Form Fields

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `user_public_id` | `string` | Yes | 用户业务 ID |
| `model_provider` | `gemini \| qwen` | Yes | 视觉模型供应商 |
| `analysis_language` | `en \| zh` | No | 返回语言，默认 `en` |
| `clinician_notes` | `string \| null` | No | 补充说明 |
| `image` | `file` | Yes | 人脸图像 |

#### Success Response

`201 Created`

响应体为完整测评详情，示例：

```json
{
  "id": "ASM-80b4f9a758c7",
  "user_public_id": "USR-0001",
  "model_provider": "gemini",
  "analysis_language": "en",
  "overall_condition_texts": {
    "en": "Mixed skin condition",
    "zh": "混合型皮肤表现"
  },
  "overall_severity": "medium",
  "overall_summary_texts": {
    "en": "Visible dryness, tone irregularity, or sensitivity indicators require follow-up observation.",
    "zh": "可见干燥、肤色不均或敏感迹象，建议持续观察并复评。"
  },
  "recommended_focus_texts": {
    "en": ["Hydration support", "Barrier comfort"],
    "zh": ["补水支持", "屏障舒缓"]
  },
  "image_path": "archive/USR-0001/ASM-80b4f9a758c7/face.jpg",
  "captured_at": "2026-04-02T10:00:00Z",
  "zones": [
    {
      "zone_name": "Forehead Zone",
      "issue_category_code": "oil_imbalance",
      "severity": "medium",
      "summary_texts": {
        "en": "Oil imbalance is visible in the forehead region.",
        "zh": "额头区域可见油脂失衡表现。"
      },
      "treatment_plan": {
        "light_type_code": "blue",
        "temperature_celsius": 33,
        "duration_minutes": 8,
        "humidification_enabled": false,
        "notes_texts": {
          "en": "Use a conservative blue-light routine and reassess.",
          "zh": "建议先采用保守蓝光方案，并在治疗后复评。"
        },
        "hardware_profile": {
          "schema_version": "phototherapy_command.v1",
          "execution_channel": "reserved",
          "zone_code": "Forehead Zone",
          "light_type_code": "blue",
          "temperature_celsius": 33,
          "duration_minutes": 8,
          "humidification_enabled": false,
          "safety_profile": {
            "temperature_celsius": {
              "min": 30,
              "max": 42,
              "unit": "celsius"
            },
            "duration_minutes": {
              "min": 4,
              "max": 20,
              "unit": "minutes"
            }
          }
        }
      }
    }
  ]
}
```

#### Error Responses

- `400 Bad Request`
- `404 Not Found`
- `422 Unprocessable Entity`

### 8.2 `GET /api/assessments/{assessment_id}`

获取单条测评详情。

#### Success Response

`200 OK`

返回结构与创建测评成功响应一致。

### 8.3 `DELETE /api/assessments/{assessment_id}`

删除测评记录及其关联归档图像。

#### Success Response

`204 No Content`

---

## 9. Treatment Plan APIs

### 9.1 `GET /api/treatment-plans`

按用户查询治疗方案列表。

#### Query Params

| Name | Type | Required | Default |
| --- | --- | --- | --- |
| `user_public_id` | `string` | Yes | - |
| `limit` | `integer` | No | `30` |

#### Success Response

`200 OK`

```json
[
  {
    "id": "TPL-91ea3df2c176",
    "user_public_id": "USR-0001",
    "assessment_id": "ASM-80b4f9a758c7",
    "planner_model_provider": "qwen_plus",
    "overall_severity": "medium",
    "summary_texts": {
      "en": "Balanced smart-mask plan for mixed dehydration and tone support.",
      "zh": "面向混合缺水与肤色支持的智能面罩方案。"
    },
    "zones": [
      {
        "zone_name": "Forehead Zone",
        "issue_category_code": "oil_imbalance",
        "severity": "medium",
        "led_color_code": "blue",
        "notes_texts": {
          "en": "Use blue LED conservatively in this zone.",
          "zh": "该区域建议保守使用蓝色 LED。"
        }
      }
    ],
    "created_at": "2026-04-02T10:20:00Z"
  }
]
```

### 9.2 `POST /api/treatment-plans`

从某份历史档案生成一条治疗方案。

说明：

- 这是治疗链路中真正把“识别结果”转成“治疗策略”的接口
- 后端会读取档案、诊疗资料库、设备画像与输出合同
- 当前由 `qwen-plus` 负责生成

#### Request Body

```json
{
  "assessment_id": "ASM-80b4f9a758c7"
}
```

#### Success Response

`201 Created`

```json
{
  "id": "TPL-91ea3df2c176",
  "user_public_id": "USR-0001",
  "assessment_id": "ASM-80b4f9a758c7",
  "planner_model_provider": "qwen_plus",
  "overall_severity": "medium",
  "summary_texts": {
    "en": "Balanced smart-mask plan for mixed dehydration and tone support.",
    "zh": "面向混合缺水与肤色支持的智能面罩方案。"
  },
  "rationale_texts": {
    "en": "This plan separates per-zone LED color from global thermal and humidification controls.",
    "zh": "该方案将分区 LED 光色与全局温度、加湿控制分开处理。"
  },
  "global_settings": {
    "brightness_percent": 60,
    "temperature_celsius": 33,
    "humidification_frequency_level": 65,
    "timer_minutes": 11
  },
  "zones": [
    {
      "zone_name": "Forehead Zone",
      "issue_category_code": "oil_imbalance",
      "severity": "medium",
      "led_color_code": "blue",
      "notes_texts": {
        "en": "Use blue LED conservatively in this zone.",
        "zh": "该区域建议保守使用蓝色 LED。"
      }
    }
  ],
  "created_at": "2026-04-02T10:20:00Z"
}
```

### 9.3 `GET /api/treatment-plans/{plan_id}`

获取单条治疗方案详情。

#### Success Response

`200 OK`

返回结构与 `POST /api/treatment-plans` 的成功响应一致。

---

## 10. Treatment Control APIs

### 10.1 `GET /api/treatment-control/options`

返回智能面罩控制范围。

#### Success Response

`200 OK`

```json
{
  "mask_zone_codes": [
    "Forehead Zone",
    "Periorbital Zone",
    "Nasal Zone",
    "Left Malar Zone",
    "Right Malar Zone",
    "Perioral Zone",
    "Mandibular/Chin Zone",
    "Jawline Zone"
  ],
  "light_color_codes": ["red", "orange", "yellow", "green", "cyan", "blue", "purple"],
  "brightness_percent": {
    "min": 0,
    "max": 100,
    "step": 1,
    "unit": "percent"
  },
  "temperature_celsius": {
    "min": 20,
    "max": 40,
    "step": 1,
    "unit": "celsius"
  },
  "humidification_frequency_level": {
    "min": 0,
    "max": 100,
    "step": 1,
    "unit": "level"
  },
  "timer_minutes": {
    "min": 1,
    "max": 60,
    "step": 1,
    "unit": "minutes"
  }
}
```

### 10.2 `POST /api/treatment-control/preset`

根据治疗方案生成智能面罩控制会话。

说明：

- 输入是治疗方案，不再是测评 ID + 区域名
- 输出是整个面罩的控制会话
- 分区 LED 配置与全局参数同时返回

#### Request Body

```json
{
  "treatment_plan_id": "TPL-91ea3df2c176"
}
```

#### Success Response

`200 OK`

```json
{
  "schema_version": "mask_control.v1",
  "execution_channel": "reserved",
  "treatment_plan_id": "TPL-91ea3df2c176",
  "user_public_id": "USR-0001",
  "overall_severity": "medium",
  "summary_texts": {
    "en": "Balanced smart-mask plan for mixed dehydration and tone support.",
    "zh": "面向混合缺水与肤色支持的智能面罩方案。"
  },
  "global_settings": {
    "brightness_percent": 60,
    "temperature_celsius": 33,
    "humidification_frequency_level": 65,
    "timer_minutes": 11
  },
  "zone_led_settings": [
    {
      "zone_name": "Forehead Zone",
      "issue_category_code": "oil_imbalance",
      "severity": "medium",
      "led_color_code": "blue"
    }
  ]
}
```

---

## 11. Treatment Record APIs

### 11.1 `GET /api/treatment-records`

按用户查询治疗记录列表。

#### Query Params

| Name | Type | Required | Default |
| --- | --- | --- | --- |
| `user_public_id` | `string` | Yes | - |
| `limit` | `integer` | No | `30` |

#### Success Response

`200 OK`

```json
[
  {
    "id": "REC-4a3c9b4a1b2c",
    "user_public_id": "USR-0001",
    "treatment_plan_id": "TPL-91ea3df2c176",
    "plan_summary_texts": {
      "en": "Balanced smart-mask plan for mixed dehydration and tone support.",
      "zh": "面向混合缺水与肤色支持的智能面罩方案。"
    },
    "overall_severity": "medium",
    "status": "running",
    "timer_minutes": 11,
    "created_at": "2026-04-02T10:25:00Z",
    "updated_at": "2026-04-02T10:25:00Z",
    "global_settings": {
      "brightness_percent": 60,
      "temperature_celsius": 33,
      "humidification_frequency_level": 65,
      "timer_minutes": 11
    },
    "zone_led_settings": [
      {
        "zone_name": "Forehead Zone",
        "issue_category_code": "oil_imbalance",
        "severity": "medium",
        "led_color_code": "blue"
      }
    ]
  }
]
```

### 11.2 `POST /api/treatment-records`

创建治疗记录。

这个接口通常在用户点击“开始治疗”时调用。

#### Request Body

```json
{
  "treatment_plan_id": "TPL-91ea3df2c176",
  "global_settings": {
    "brightness_percent": 60,
    "temperature_celsius": 33,
    "humidification_frequency_level": 65,
    "timer_minutes": 11
  },
  "zone_led_settings": [
    {
      "zone_name": "Forehead Zone",
      "issue_category_code": "oil_imbalance",
      "severity": "medium",
      "led_color_code": "blue"
    }
  ]
}
```

#### Success Response

`201 Created`

返回 `TreatmentRecordRead`。

### 11.3 `PATCH /api/treatment-records/{record_id}/status`

更新治疗记录状态。

当前支持：

- `running`
- `paused`
- `completed`

#### Request Body

```json
{
  "status": "paused"
}
```

#### Success Response

`200 OK`

返回更新后的 `TreatmentRecordRead`。

---

## 12. 静态文件接口

### 12.1 `GET /files/{relative_path}`

读取归档图片。

说明：

- `image_path` 字段保存的是相对路径
- 前端需要把它拼接到 `/files/` 下访问

示例：

如果接口返回：

```json
{
  "image_path": "archive/USR-0001/ASM-80b4f9a758c7/face.jpg"
}
```

实际访问地址为：

```text
http://127.0.0.1:8000/files/archive/USR-0001/ASM-80b4f9a758c7/face.jpg
```

---

## 13. 推荐联调流程

### 13.1 面部测评闭环

1. `POST /api/users`
2. `POST /api/assessments`
3. `GET /api/users/{user_public_id}/assessments`
4. `GET /api/assessments/{assessment_id}`

### 13.2 从档案生成治疗方案

1. `GET /api/users/{user_public_id}/assessments`
2. 选择某个 `assessment_id`
3. `POST /api/treatment-plans`
4. `GET /api/treatment-plans?user_public_id=...`
5. `GET /api/treatment-plans/{plan_id}`

### 13.3 从治疗方案进入控制和记录

1. `POST /api/treatment-control/preset`
2. 用户修改参数
3. `POST /api/treatment-records`
4. `PATCH /api/treatment-records/{record_id}/status`
5. `GET /api/treatment-records?user_public_id=...`

---

## 14. PowerShell 示例

### 14.1 创建用户

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/users" `
  -ContentType "application/json" `
  -Body '{"name":"Alice","notes":"sensitive skin"}'
```

### 14.2 列出用户

```powershell
Invoke-RestMethod `
  -Method Get `
  -Uri "http://127.0.0.1:8000/api/users"
```

### 14.3 生成治疗方案

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/treatment-plans" `
  -ContentType "application/json" `
  -Body '{"assessment_id":"ASM-80b4f9a758c7"}'
```

### 14.4 获取治疗控制预设

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/treatment-control/preset" `
  -ContentType "application/json" `
  -Body '{"treatment_plan_id":"TPL-91ea3df2c176"}'
```

### 14.5 创建治疗记录

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://127.0.0.1:8000/api/treatment-records" `
  -ContentType "application/json" `
  -Body @'
{
  "treatment_plan_id": "TPL-91ea3df2c176",
  "global_settings": {
    "brightness_percent": 60,
    "temperature_celsius": 33,
    "humidification_frequency_level": 65,
    "timer_minutes": 11
  },
  "zone_led_settings": [
    {
      "zone_name": "Forehead Zone",
      "issue_category_code": "oil_imbalance",
      "severity": "medium",
      "led_color_code": "blue"
    }
  ]
}
'@
```

### 14.6 暂停治疗

```powershell
Invoke-RestMethod `
  -Method Patch `
  -Uri "http://127.0.0.1:8000/api/treatment-records/REC-4a3c9b4a1b2c/status" `
  -ContentType "application/json" `
  -Body '{"status":"paused"}'
```

---

## 15. 后续扩展建议

### 15.1 诊疗资料库

治疗方案质量增强建议优先维护：

- `common/knowledge/treatment_plan_library/case_memory.json`
- `common/knowledge/treatment_plan_library/clinical_guidelines.md`

### 15.2 设备层

后续建议新增：

- 设备执行任务创建接口
- 设备执行状态查询接口
- 设备回执错误码接口
- 治疗记录审计日志接口

### 15.3 分页与查询

当前列表接口主要使用 `limit`。

如数据量提升，建议扩展为：

- cursor pagination
- page + page_size
- 时间范围过滤
- 状态过滤

### 15.4 API Versioning

当前尚未使用 `/api/v1` 路径版本。

未来如需长期对外兼容，建议通过以下组合演进：

- 路径版本
- JSON 合同版本
- 协议 `schema_version`
