import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AppLanguage, LocalizedStringList, LocalizedText } from "./types";

type MessageKey =
  | "brandDescription"
  | "navAssessment"
  | "navArchive"
  | "navTreatment"
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
  | "completeAssessmentFirst"
  | "hardwareReserve"
  | "hardwareReserveDescription"
  | "hardwareCommandSchema"
  | "executionChannel"
  | "safetyRange"
  | "roster"
  | "userManagement"
  | "create"
  | "createUser"
  | "switchCurrentUser"
  | "currentUser"
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
    brandDescription: "Cloud vision analysis, daily archive tracking, and hardware-ready phototherapy orchestration.",
    navAssessment: "Face Assessment",
    navArchive: "Face Archive",
    navTreatment: "Treatment Plan",
    navUsers: "Users",
    activeSubject: "Active Subject",
    selectUser: "Select or create a user",
    bindUserFirst: "Bind a subject profile before entering the workflow.",
    language: "Language",
    heroEyebrow: "Production Workspace",
    heroDelivered: "Delivered in this phase: multi-user entry, face assessment, daily image archive, and historical review.",
    waitingUser: "Waiting for user selection",
    waitingUserDescription: "Choose or create a subject profile before entering the workspace.",
    entryGateTitle: "Choose a subject before entering the assessment workflow",
    entryGateDescription: "Each subject receives an independent business ID and a separate daily skin-state archive.",
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
    cameraModalDescription: "Open a compact live preview window, align the face, and capture directly into the assessment form.",
    openCamera: "Open camera",
    capturePhoto: "Capture photo",
    close: "Close",
    retake: "Retake",
    cameraNotSupported: "This browser does not support camera access.",
    cameraReady: "Camera preview is ready.",
    capturedPhoto: "Captured photo attached",
    supplementNotes: "Supplement notes",
    supplementPlaceholder: "For example: morning natural light, no makeup, 10 minutes after cleansing.",
    submitAssessment: "Run assessment and archive",
    submittingAssessment: "Assessing...",
    waitingAssessment: "Waiting for the first analysis",
    waitingAssessmentDescription: "Once an image is submitted, the overall condition, regional concerns, and treatment plan will appear here.",
    todayAnalysis: "Today's Analysis",
    treatmentRecommendation: "Treatment recommendation",
    lightType: "Light type",
    temperature: "Temperature",
    duration: "Duration",
    humidification: "Humidification",
    hardwarePayload: "Hardware payload",
    history: "History",
    archiveTitle: "Face Archive",
    loadingArchive: "Loading archive...",
    emptyArchive: "This user does not have any assessment records yet.",
    recordDetail: "Record detail",
    selectHistory: "Select a history entry to view the detailed record.",
    treatmentWorkspace: "Treatment Workspace",
    treatmentTitle: "Treatment Plan",
    completeAssessmentFirst: "Complete one assessment first to review the regional plan.",
    hardwareReserve: "Hardware interface reservation",
    hardwareReserveDescription: "These treatment parameters already follow a device-ready command structure for future control of light spectrum, temperature, humidification, and runtime.",
    hardwareCommandSchema: "Command schema",
    executionChannel: "Execution channel",
    safetyRange: "Safety range",
    roster: "Roster",
    userManagement: "User Management",
    create: "Create",
    createUser: "Create user",
    switchCurrentUser: "Switch to current user",
    currentUser: "Current user",
    output: "Output",
    focusAreas: "Focus areas",
    userPlaceholder: "For example: Patient Lin",
    notesPlaceholder: "For example: combination skin, low temperature preferred during sensitivity.",
    genericError: "Request failed.",
    assessmentInProgress: "Assessment in progress",
    assessmentInProgressDescription: "A simulated progress ring is shown while the image is being uploaded and the model is generating the structured result.",
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
    brandDescription: "云端视觉分析、每日档案追踪，以及面向硬件联动的光疗工作台。",
    navAssessment: "面部测评",
    navArchive: "面部档案",
    navTreatment: "治疗方案",
    navUsers: "用户",
    activeSubject: "当前对象",
    selectUser: "选择或创建用户",
    bindUserFirst: "进入工作流前请先绑定人物档案。",
    language: "语言切换",
    heroEyebrow: "Production Workspace",
    heroDelivered: "当前阶段已交付：多用户入口、面部状态识别、每日图像归档、历史档案浏览。",
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
    liveCapture: "Live Capture",
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
    waitingAssessmentDescription: "完成上传后，这里会展示整体状态、分区问题与治疗建议。",
    todayAnalysis: "今日分析结果",
    treatmentRecommendation: "治疗建议",
    lightType: "光类型",
    temperature: "温度",
    duration: "时长",
    humidification: "加湿",
    hardwarePayload: "硬件指令载荷",
    history: "History",
    archiveTitle: "面部档案",
    loadingArchive: "正在加载档案...",
    emptyArchive: "当前用户还没有历史测评记录。",
    recordDetail: "单次测评详情",
    selectHistory: "选择一条历史记录查看详细内容。",
    treatmentWorkspace: "Treatment Workspace",
    treatmentTitle: "治疗方案",
    completeAssessmentFirst: "请先在面部测评页完成一次识别，再查看分区治疗方案。",
    hardwareReserve: "硬件接口预留",
    hardwareReserveDescription: "当前展示的参数已经按设备控制命令结构组织，后续可直接对接光色、温度、加湿和时长控制。",
    hardwareCommandSchema: "命令协议",
    executionChannel: "执行通道",
    safetyRange: "安全范围",
    roster: "Roster",
    userManagement: "用户档案管理",
    create: "Create",
    createUser: "创建用户",
    switchCurrentUser: "点击切换为当前用户",
    currentUser: "当前使用中",
    output: "Output",
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
