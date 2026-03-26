ZONE_DEFINITIONS = [
    {"code": "Forehead Zone", "labels": {"en": "Forehead Zone", "zh": "额头区"}},
    {"code": "Periorbital Zone", "labels": {"en": "Periorbital Zone", "zh": "眼周区"}},
    {"code": "Nasal Zone", "labels": {"en": "Nasal Zone", "zh": "鼻部区"}},
    {"code": "Left Malar Zone", "labels": {"en": "Left Malar Zone", "zh": "左颧颊区"}},
    {"code": "Right Malar Zone", "labels": {"en": "Right Malar Zone", "zh": "右颧颊区"}},
    {"code": "Perioral Zone", "labels": {"en": "Perioral Zone", "zh": "口周区"}},
    {"code": "Mandibular/Chin Zone", "labels": {"en": "Mandibular/Chin Zone", "zh": "下颌/下巴区"}},
    {"code": "Jawline Zone", "labels": {"en": "Jawline Zone", "zh": "下颌线区"}},
]

ZONE_ORDER = [zone["code"] for zone in ZONE_DEFINITIONS]

ZONE_ALIASES = {
    "forehead zone": "Forehead Zone",
    "periorbital zone": "Periorbital Zone",
    "nasal zone": "Nasal Zone",
    "left malar zone": "Left Malar Zone",
    "right malar zone": "Right Malar Zone",
    "left/right malar zone": "Left Malar Zone",
    "perioral zone": "Perioral Zone",
    "mandibular/chin zone": "Mandibular/Chin Zone",
    "jawline zone": "Jawline Zone",
}

ISSUE_CATEGORY_LABELS = {
    "dehydration": {"en": "Dehydration", "zh": "缺水干燥"},
    "erythema": {"en": "Erythema", "zh": "泛红敏感"},
    "oil_imbalance": {"en": "Oil Imbalance", "zh": "油脂失衡"},
    "texture_irregularity": {"en": "Texture Irregularity", "zh": "纹理粗糙"},
    "pigmentation": {"en": "Pigmentation", "zh": "色沉暗沉"},
    "comedonal_congestion": {"en": "Comedonal Congestion", "zh": "粉刺堵塞"},
    "barrier_sensitivity": {"en": "Barrier Sensitivity", "zh": "屏障脆弱"},
    "elasticity_loss": {"en": "Elasticity Loss", "zh": "弹性下降"},
    "puffiness": {"en": "Puffiness", "zh": "浮肿"},
    "uneven_tone": {"en": "Uneven Tone", "zh": "肤色不均"},
    "insufficient_data": {"en": "Insufficient Data", "zh": "信息不足"},
}

LIGHT_TYPE_LABELS = {
    "red": {"en": "Red Light", "zh": "红光"},
    "blue": {"en": "Blue Light", "zh": "蓝光"},
    "amber": {"en": "Amber Light", "zh": "琥珀光"},
    "green": {"en": "Green Light", "zh": "绿光"},
    "infrared": {"en": "Infrared Light", "zh": "红外光"},
    "mixed": {"en": "Mixed Spectrum", "zh": "复合光谱"},
}

LIGHT_TYPE_ALIASES = {
    "red": "red",
    "red light": "red",
    "blue": "blue",
    "blue light": "blue",
    "amber": "amber",
    "amber light": "amber",
    "yellow": "amber",
    "green": "green",
    "green light": "green",
    "infrared": "infrared",
    "infrared light": "infrared",
    "mixed": "mixed",
    "mixed spectrum": "mixed",
}

SEVERITY_LABELS = {
    "low": {"en": "Low", "zh": "低"},
    "medium": {"en": "Medium", "zh": "中"},
    "high": {"en": "High", "zh": "高"},
}

VALID_SEVERITIES = set(SEVERITY_LABELS.keys())
VALID_ISSUE_CATEGORIES = set(ISSUE_CATEGORY_LABELS.keys())
VALID_LIGHT_TYPES = set(LIGHT_TYPE_LABELS.keys())

TEMPERATURE_RANGE = {"min": 30, "max": 42, "unit": "celsius"}
DURATION_RANGE = {"min": 4, "max": 20, "unit": "minutes"}
