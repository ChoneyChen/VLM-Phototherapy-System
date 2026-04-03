import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppLanguage, LocalizedStringList, LocalizedText } from "./types";

type MessageKey =
  | "brandDescription"
  | "navAssessment"
  | "navArchive"
  | "navTreatment"
  | "navControl"
  | "navRecords"
  | "navUsers"
  | "activeSubject"
  | "selectUser"
  | "bindUserFirst"
  | "language"
  | "heroEyebrow"
  | "heroDelivered"
  | "waitingUser"
  | "waitingUserDescription"
  | "entryGateTitle"
  | "entryGateDescription"
  | "selectExistingUser"
  | "noUserYet"
  | "createNewUser"
  | "userName"
  | "notes"
  | "createAndEnter"
  | "liveCapture"
  | "assessmentTitle"
  | "visionModel"
  | "uploadImage"
  | "uploadImageHint"
  | "cameraCapture"
  | "cameraModalTitle"
  | "cameraModalDescription"
  | "openCamera"
  | "capturePhoto"
  | "close"
  | "retake"
  | "cameraNotSupported"
  | "cameraReady"
  | "capturedPhoto"
  | "supplementNotes"
  | "supplementPlaceholder"
  | "submitAssessment"
  | "submittingAssessment"
  | "waitingAssessment"
  | "waitingAssessmentDescription"
  | "todayAnalysis"
  | "treatmentRecommendation"
  | "lightType"
  | "temperature"
  | "duration"
  | "humidification"
  | "hardwarePayload"
  | "history"
  | "archiveTitle"
  | "loadingArchive"
  | "emptyArchive"
  | "recordDetail"
  | "selectHistory"
  | "treatmentWorkspace"
  | "treatmentTitle"
  | "treatmentPlansPageDescription"
  | "loadingTreatmentPlans"
  | "noTreatmentPlansYet"
  | "noTreatmentPlansDescription"
  | "planSourceAssessment"
  | "zonesAndIssues"
  | "generateTreatmentPlanAction"
  | "planGenerationProgress"
  | "planGenerationProgressDescription"
  | "hardwareReserve"
  | "hardwareReserveDescription"
  | "hardwareCommandSchema"
  | "executionChannel"
  | "safetyRange"
  | "controlWorkspace"
  | "controlTitle"
  | "controlDescription"
  | "maskControlDescription"
  | "selectPlanToControl"
  | "pickZoneToControl"
  | "goToTreatmentPlans"
  | "recommendedPlan"
  | "recommendedIssue"
  | "recommendedSummary"
  | "controlValues"
  | "lightColor"
  | "zoneLedColor"
  | "brightness"
  | "humidificationFrequency"
  | "timer"
  | "commandPreview"
  | "deviceBindingReserved"
  | "deviceBindingReservedDescription"
  | "controlLoading"
  | "openControl"
  | "globalTreatmentControls"
  | "maskFaceMap"
  | "selectedZone"
  | "startTreatment"
  | "resumeTreatment"
  | "pauseTreatment"
  | "recordsTitle"
  | "recordsDescription"
  | "loadingRecords"
  | "noTreatmentRecordsYet"
  | "noTreatmentRecordsDescription"
  | "recordStartedAt"
  | "recordUpdatedAt"
  | "recordDuration"
  | "recordLinkedPlan"
  | "recordStatus"
  | "recordStatusRunning"
  | "recordStatusPaused"
  | "recordStatusCompleted"
  | "roster"
  | "userManagement"
  | "create"
  | "createUser"
  | "switchCurrentUser"
  | "currentUser"
  | "activeBadge"
  | "output"
  | "focusAreas"
  | "userPlaceholder"
  | "notesPlaceholder"
  | "genericError"
  | "assessmentInProgress"
  | "assessmentInProgressDescription"
  | "treatThisRecord"
  | "deleteRecordAction"
  | "deleteRecordConfirm"
  | "treatmentFilter"
  | "showAll"
  | "showNonLow"
  | "showHighOnly"
  | "problem"
  | "noMatchingPlans"
  | "deleteUserAction"
  | "deleteUserConfirm";

const LANGUAGE_STORAGE_KEY = "vlm-phototherapy-language";

const messages: Record<AppLanguage, Record<MessageKey, string>> = {
  en: {
    brandDescription:
      "Cloud vision analysis, archive-driven treatment planning, and hardware-ready smart mask control.",
    navAssessment: "Face Assessment",
    navArchive: "Face Archive",
    navTreatment: "Treatment Plan",
    navControl: "Treatment Control",
    navRecords: "Treatment Records",
    navUsers: "Users",
    activeSubject: "Active Subject",
    selectUser: "Select or create a user",
    bindUserFirst: "Bind a subject profile before entering the workflow.",
    language: "Language",
    heroEyebrow: "Production Workspace",
    heroDelivered:
      "Delivered in this phase: multi-user entry, face assessment, daily archive, archive-triggered treatment plans, smart mask control, and treatment records.",
    waitingUser: "Waiting for user selection",
    waitingUserDescription: "Choose or create a subject profile before entering the workspace.",
    entryGateTitle: "Choose a subject before entering the assessment workflow",
    entryGateDescription:
      "Each subject receives an independent business ID and a separate daily skin-state archive.",
    selectExistingUser: "Select an existing user",
    noUserYet: "No subject profile exists yet. Create the first one to continue.",
    createNewUser: "Create a new user",
    userName: "User name",
    notes: "Notes",
    createAndEnter: "Create and enter",
    liveCapture: "Live Capture",
    assessmentTitle: "Face Assessment",
    visionModel: "Vision model",
    uploadImage: "Upload frontal face image",
    uploadImageHint: "Use JPEG, PNG, or WEBP.",
    cameraCapture: "Camera Capture",
    cameraModalTitle: "Camera capture",
    cameraModalDescription:
      "Open a compact live preview window, align the face, and capture directly into the assessment form.",
    openCamera: "Open camera",
    capturePhoto: "Capture photo",
    close: "Close",
    retake: "Retake",
    cameraNotSupported: "This browser does not support camera access.",
    cameraReady: "Camera preview is ready.",
    capturedPhoto: "Captured photo attached",
    supplementNotes: "Supplement notes",
    supplementPlaceholder:
      "For example: morning natural light, no makeup, 10 minutes after cleansing.",
    submitAssessment: "Run assessment and archive",
    submittingAssessment: "Assessing...",
    waitingAssessment: "Waiting for the first analysis",
    waitingAssessmentDescription:
      "Once an image is submitted, the overall condition, regional concerns, and assessment-time guidance will appear here.",
    todayAnalysis: "Today's Analysis",
    treatmentRecommendation: "Assessment-time guidance",
    lightType: "Light type",
    temperature: "Temperature",
    duration: "Duration",
    humidification: "Humidification",
    hardwarePayload: "Hardware payload",
    history: "Archive History",
    archiveTitle: "Face Archive",
    loadingArchive: "Loading archive...",
    emptyArchive: "This user does not have any assessment records yet.",
    recordDetail: "Assessment detail",
    selectHistory: "Select a history entry to view the detailed record.",
    treatmentWorkspace: "Treatment Workspace",
    treatmentTitle: "Treatment Plans",
    treatmentPlansPageDescription:
      "Treatment plans are generated from archived assessments. Each card summarizes severity and zone-level concerns for one saved facial record.",
    loadingTreatmentPlans: "Loading treatment plans...",
    noTreatmentPlansYet: "No treatment plan has been generated yet.",
    noTreatmentPlansDescription:
      "Open Face Archive and use Generate Treatment Plan on an archived assessment to create the first smart-mask plan.",
    planSourceAssessment: "Source assessment",
    zonesAndIssues: "Severity, zones, and issues",
    generateTreatmentPlanAction: "Generate treatment plan",
    planGenerationProgress: "Generating treatment plan",
    planGenerationProgressDescription:
      "The system is creating a structured smart-mask plan from the archived facial assessment and clinical library.",
    hardwareReserve: "Hardware interface reservation",
    hardwareReserveDescription:
      "These treatment parameters already follow a device-ready command structure for future control of light spectrum, temperature, humidification, and runtime.",
    hardwareCommandSchema: "Command schema",
    executionChannel: "Execution channel",
    safetyRange: "Safety range",
    controlWorkspace: "Control Workspace",
    controlTitle: "Treatment Control",
    controlDescription: "A structured device-control console derived from the selected treatment plan.",
    maskControlDescription:
      "Smart mask control separates per-zone LED color from global heating, humidification, brightness, and timer settings.",
    selectPlanToControl: "Choose a treatment plan to load the smart mask control workspace.",
    pickZoneToControl: "Pick a facial zone to edit its LED color.",
    goToTreatmentPlans: "Open Treatment Plans and select one plan card to continue.",
    recommendedPlan: "Selected plan",
    recommendedIssue: "Issue",
    recommendedSummary: "Clinical rationale",
    controlValues: "Control values",
    lightColor: "Light color",
    zoneLedColor: "Zone LED color",
    brightness: "Brightness",
    humidificationFrequency: "Humidification frequency",
    timer: "Timer",
    commandPreview: "Command preview",
    deviceBindingReserved: "Device binding reserved",
    deviceBindingReservedDescription:
      "This console edits a reserved control session only. Physical execution will be bound after the hardware protocol is finalized.",
    controlLoading: "Loading control preset...",
    openControl: "Open control",
    globalTreatmentControls: "Global mask controls",
    maskFaceMap: "Mask face map",
    selectedZone: "Selected zone",
    startTreatment: "Start treatment",
    resumeTreatment: "Resume treatment",
    pauseTreatment: "Pause treatment",
    recordsTitle: "Treatment Records",
    recordsDescription:
      "Each record stores the executed timer, current status, linked plan, and the control values that were active when treatment started.",
    loadingRecords: "Loading treatment records...",
    noTreatmentRecordsYet: "No treatment record exists yet.",
    noTreatmentRecordsDescription:
      "Start a treatment from the Treatment Control page to create the first execution record.",
    recordStartedAt: "Started at",
    recordUpdatedAt: "Updated at",
    recordDuration: "Duration",
    recordLinkedPlan: "Linked treatment plan",
    recordStatus: "Status",
    recordStatusRunning: "Running",
    recordStatusPaused: "Paused",
    recordStatusCompleted: "Completed",
    roster: "Roster",
    userManagement: "User Management",
    create: "Create",
    createUser: "Create user",
    switchCurrentUser: "Switch to current user",
    currentUser: "Current user",
    activeBadge: "Active",
    output: "Output",
    focusAreas: "Focus areas",
    userPlaceholder: "For example: Patient Lin",
    notesPlaceholder: "For example: combination skin, low temperature preferred during sensitivity.",
    genericError: "Request failed.",
    assessmentInProgress: "Assessment in progress",
    assessmentInProgressDescription:
      "A simulated progress ring is shown while the image is being uploaded and the model is generating the structured result.",
    treatThisRecord: "Treat this record",
    deleteRecordAction: "Delete record",
    deleteRecordConfirm: "Delete this archived assessment?",
    treatmentFilter: "Treatment filter",
    showAll: "Show all",
    showNonLow: "Non-low only",
    showHighOnly: "High only",
    problem: "Problem",
    noMatchingPlans: "No treatment plan matches the current filter.",
    deleteUserAction: "Delete user",
    deleteUserConfirm: "Delete this user and all archived records?"
  },
  zh: {
    brandDescription: "云端视觉分析、档案驱动的治疗方案生成，以及面向智能光疗面罩的硬件控制工作台。",
    navAssessment: "面部测评",
    navArchive: "面部档案",
    navTreatment: "治疗方案",
    navControl: "治疗控制",
    navRecords: "治疗记录",
    navUsers: "用户",
    activeSubject: "当前对象",
    selectUser: "选择或创建用户",
    bindUserFirst: "进入工作流前请先绑定人物档案。",
    language: "语言切换",
    heroEyebrow: "Production Workspace",
    heroDelivered:
      "当前阶段已交付：多用户入口、面部状态识别、每日档案沉淀、由档案触发的治疗方案、智能面罩治疗控制，以及治疗记录。",
    waitingUser: "等待用户选择",
    waitingUserDescription: "进入工作台前，请先选择或创建一个人物档案。",
    entryGateTitle: "先选择用户，再进入测评工作流",
    entryGateDescription: "每位用户都会分配独立业务 ID，并拥有单独的每日皮肤状态档案库。",
    selectExistingUser: "选择已有用户",
    noUserYet: "当前还没有人物档案，请先创建第一位用户。",
    createNewUser: "创建新用户",
    userName: "用户名称",
    notes: "备注",
    createAndEnter: "创建并进入",
    liveCapture: "实时拍摄",
    assessmentTitle: "面部状态识别区",
    visionModel: "视觉模型",
    uploadImage: "上传正面人脸图像",
    uploadImageHint: "支持 JPEG、PNG、WEBP。",
    cameraCapture: "摄像头拍照",
    cameraModalTitle: "摄像头拍照",
    cameraModalDescription: "丝滑打开小窗口预览摄像头画面，对准人脸后直接拍照并回填到测评表单。",
    openCamera: "打开摄像头",
    capturePhoto: "拍照",
    close: "关闭",
    retake: "重拍",
    cameraNotSupported: "当前浏览器不支持摄像头访问。",
    cameraReady: "摄像头预览已就绪。",
    capturedPhoto: "已附加拍摄照片",
    supplementNotes: "补充说明",
    supplementPlaceholder: "例如：今日拍摄为晨间自然光、无妆、洁面后 10 分钟。",
    submitAssessment: "开始识别并归档",
    submittingAssessment: "识别中...",
    waitingAssessment: "等待首份识别结果",
    waitingAssessmentDescription: "完成上传后，这里会展示整体状态、分区问题与测评阶段的治疗建议。",
    todayAnalysis: "今日分析结果",
    treatmentRecommendation: "测评阶段建议",
    lightType: "光类型",
    temperature: "温度",
    duration: "时长",
    humidification: "加湿",
    hardwarePayload: "硬件指令载荷",
    history: "历史档案",
    archiveTitle: "面部档案",
    loadingArchive: "正在加载档案...",
    emptyArchive: "当前用户还没有历史测评记录。",
    recordDetail: "测评详情",
    selectHistory: "选择一条历史记录查看详细内容。",
    treatmentWorkspace: "治疗方案工作区",
    treatmentTitle: "治疗方案",
    treatmentPlansPageDescription:
      "治疗方案由历史档案单独生成。每张卡片对应一份面部档案，只展示整体严重性、分区与问题摘要，点击后进入治疗控制。",
    loadingTreatmentPlans: "正在加载治疗方案...",
    noTreatmentPlansYet: "当前还没有生成任何治疗方案。",
    noTreatmentPlansDescription: "请先到面部档案页，对某份历史档案点击“新增治疗方案”。",
    planSourceAssessment: "来源档案",
    zonesAndIssues: "严重性、分区与问题",
    generateTreatmentPlanAction: "新增治疗方案",
    planGenerationProgress: "正在生成治疗方案",
    planGenerationProgressDescription: "系统正在结合历史面部档案与诊疗资料库，生成结构化智能面罩治疗方案。",
    hardwareReserve: "硬件接口预留",
    hardwareReserveDescription: "当前展示的参数已经按设备控制命令结构组织，后续可直接对接光色、温度、加湿和时长控制。",
    hardwareCommandSchema: "命令协议",
    executionChannel: "执行通道",
    safetyRange: "安全范围",
    controlWorkspace: "治疗控制工作台",
    controlTitle: "治疗控制",
    controlDescription: "该栏用于承接治疗方案并生成结构化的设备控制预设，后续将作为物理设备对接的核心工作区。",
    maskControlDescription: "智能光疗面罩按分区控制 LED 光色，并将加热、加湿、亮度和定时作为全局参数统一调节。",
    selectPlanToControl: "请选择一份治疗方案，载入智能面罩治疗控制台。",
    pickZoneToControl: "点击面部区域，编辑该区域的 LED 光色。",
    goToTreatmentPlans: "请先前往治疗方案页，选择一份方案后再进入治疗控制。",
    recommendedPlan: "当前方案",
    recommendedIssue: "对应问题",
    recommendedSummary: "方案说明",
    controlValues: "控制参数",
    lightColor: "光色",
    zoneLedColor: "区域 LED 光色",
    brightness: "亮度",
    humidificationFrequency: "加湿频率",
    timer: "定时",
    commandPreview: "指令预览",
    deviceBindingReserved: "设备接口预留",
    deviceBindingReservedDescription: "当前控制台只编辑保留的控制会话，真实物理执行会在后续硬件协议明确后接入。",
    controlLoading: "正在载入控制预设...",
    openControl: "进入治疗控制",
    globalTreatmentControls: "全局治疗控制",
    maskFaceMap: "面罩人脸图",
    selectedZone: "当前选中区域",
    startTreatment: "开始治疗",
    resumeTreatment: "继续治疗",
    pauseTreatment: "暂停治疗",
    recordsTitle: "治疗记录",
    recordsDescription: "每条记录会保存治疗开始时间、设定时长、关联方案、当前状态，以及当次启动时的控制参数。",
    loadingRecords: "正在加载治疗记录...",
    noTreatmentRecordsYet: "当前还没有治疗记录。",
    noTreatmentRecordsDescription: "请先在治疗控制页启动一次治疗，系统会自动生成记录。",
    recordStartedAt: "开始时间",
    recordUpdatedAt: "更新时间",
    recordDuration: "时长",
    recordLinkedPlan: "关联治疗方案",
    recordStatus: "状态",
    recordStatusRunning: "进行中",
    recordStatusPaused: "已暂停",
    recordStatusCompleted: "已完成",
    roster: "用户列表",
    userManagement: "用户档案管理",
    create: "创建",
    createUser: "创建用户",
    switchCurrentUser: "点击切换为当前用户",
    currentUser: "当前使用中",
    activeBadge: "使用中",
    output: "输出",
    focusAreas: "关注重点",
    userPlaceholder: "例如：Patient Lin",
    notesPlaceholder: "例如：混合肌、敏感期需低温方案",
    genericError: "请求失败，请稍后重试。",
    assessmentInProgress: "正在生成测评结果",
    assessmentInProgressDescription: "上传后右侧会显示一个模拟圆形进度条，表示图像上传与模型结构化分析正在进行。",
    treatThisRecord: "对此进行治疗",
    deleteRecordAction: "删除档案",
    deleteRecordConfirm: "删除这份历史档案？",
    treatmentFilter: "方案筛选",
    showAll: "展示所有",
    showNonLow: "展示非低等级",
    showHighOnly: "仅展示高等级",
    problem: "对应问题",
    noMatchingPlans: "当前筛选条件下没有可展示的治疗方案。",
    deleteUserAction: "删除用户",
    deleteUserConfirm: "删除该用户及其全部历史档案？"
  }
};

const zoneLabels = {
  "Forehead Zone": { en: "Forehead Zone", zh: "额头区" },
  "Periorbital Zone": { en: "Periorbital Zone", zh: "眼周区" },
  "Nasal Zone": { en: "Nasal Zone", zh: "鼻部区" },
  "Left Malar Zone": { en: "Left Malar Zone", zh: "左颧颊区" },
  "Right Malar Zone": { en: "Right Malar Zone", zh: "右颧颊区" },
  "Perioral Zone": { en: "Perioral Zone", zh: "口周区" },
  "Mandibular/Chin Zone": { en: "Mandibular/Chin Zone", zh: "下颌/下巴区" },
  "Jawline Zone": { en: "Jawline Zone", zh: "下颌线区" }
} as const;

const issueLabels: Record<string, Record<AppLanguage, string>> = {
  dehydration: { en: "Dehydration", zh: "缺水干燥" },
  erythema: { en: "Erythema", zh: "泛红敏感" },
  oil_imbalance: { en: "Oil Imbalance", zh: "油脂失衡" },
  texture_irregularity: { en: "Texture Irregularity", zh: "纹理粗糙" },
  pigmentation: { en: "Pigmentation", zh: "色沉暗沉" },
  comedonal_congestion: { en: "Comedonal Congestion", zh: "粉刺堵塞" },
  barrier_sensitivity: { en: "Barrier Sensitivity", zh: "屏障脆弱" },
  elasticity_loss: { en: "Elasticity Loss", zh: "弹性下降" },
  puffiness: { en: "Puffiness", zh: "浮肿" },
  uneven_tone: { en: "Uneven Tone", zh: "肤色不均" },
  insufficient_data: { en: "Insufficient Data", zh: "信息不足" }
};

const lightLabels: Record<string, Record<AppLanguage, string>> = {
  red: { en: "Red Light", zh: "红光" },
  blue: { en: "Blue Light", zh: "蓝光" },
  amber: { en: "Amber Light", zh: "琥珀光" },
  green: { en: "Green Light", zh: "绿光" },
  infrared: { en: "Infrared Light", zh: "红外光" },
  mixed: { en: "Mixed Spectrum", zh: "复合光谱" }
};

const lightColorLabels: Record<string, Record<AppLanguage, string>> = {
  red: { en: "Red", zh: "红色" },
  orange: { en: "Orange", zh: "橙色" },
  yellow: { en: "Yellow", zh: "黄色" },
  green: { en: "Green", zh: "绿色" },
  cyan: { en: "Cyan", zh: "青色" },
  blue: { en: "Blue", zh: "蓝色" },
  purple: { en: "Purple", zh: "紫色" }
};

const severityLabels: Record<string, Record<AppLanguage, string>> = {
  low: { en: "Low", zh: "低" },
  medium: { en: "Medium", zh: "中" },
  high: { en: "High", zh: "高" }
};

interface I18nContextValue {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey) => string;
  pickText: (text: LocalizedText) => string;
  pickList: (text: LocalizedStringList) => string[];
  labelZone: (code: string) => string;
  labelIssue: (code: string) => string;
  labelLight: (code: string) => string;
  labelColor: (code: string) => string;
  labelSeverity: (code: string) => string;
  labelBoolean: (value: boolean) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<AppLanguage>(() => {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return stored === "zh" ? "zh" : "en";
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key) => messages[language][key],
      pickText: (text) => text[language],
      pickList: (text) => text[language],
      labelZone: (code) => zoneLabels[code as keyof typeof zoneLabels]?.[language] ?? code,
      labelIssue: (code) => issueLabels[code]?.[language] ?? code,
      labelLight: (code) => lightLabels[code]?.[language] ?? code,
      labelColor: (code) => lightColorLabels[code]?.[language] ?? code,
      labelSeverity: (code) => severityLabels[code]?.[language] ?? code,
      labelBoolean: (value) => (language === "zh" ? (value ? "是" : "否") : value ? "Yes" : "No")
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used inside LanguageProvider.");
  }
  return context;
}
