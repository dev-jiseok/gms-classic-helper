// Attributed adapted reference data: CC BY-NC-SA 4.0. See JOB_REFERENCE.
export const JOB_REFERENCE = {
  "source": "MapleClassic Wiki contributors",
  "sourceUrl": "https://mapleclassic.wiki/wiki/Skills",
  "license": "CC BY-NC-SA 4.0",
  "licenseUrl": "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  "verifiedAt": "2026-10-21",
  "scope": "출시 당시 초보자·1차 4계열·2차 10직업. 3차 이후와 해적은 구현되지 않은 진로입니다.",
  "skillRows": 93,
  "uniqueSkills": 80,
  "notes": [
    "정규화·한국어 표기·배열 구성은 이 프로젝트에서 편집했습니다.",
    "Wiki는 커뮤니티 참조 자료이며 현재 게임 확인이 우선합니다.",
    "개별 레벨의 데미지·지속시간 공식은 이 요약 자료에 없습니다."
  ]
};
export const JOBS = {
  "beginner": {
    "id": "beginner",
    "name": "초보자",
    "en": "Beginner",
    "family": "beginner",
    "tier": 0,
    "path": "초보자",
    "color": "#9b927b",
    "short": "새싹",
    "icon": "leaf",
    "town": "",
    "summary": "스탯과 진로를 정하고 섬 퀘스트로 출발합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Jobs",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "warrior": {
    "id": "warrior",
    "name": "전사",
    "en": "Warrior",
    "family": "warrior",
    "tier": 1,
    "path": "초보자 → 전사",
    "color": "#d4874b",
    "short": "전사",
    "icon": "sword",
    "town": "페리온",
    "summary": "근접 공격과 체력 중심. 검·도끼·둔기·창·폴암 중 진로를 고릅니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Warrior",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "fighter": {
    "id": "fighter",
    "name": "파이터",
    "en": "Fighter",
    "family": "warrior",
    "tier": 2,
    "path": "초보자 → 전사 → 파이터",
    "color": "#d4874b",
    "short": "전사",
    "icon": "sword",
    "town": "페리온",
    "summary": "검 또는 도끼를 골라 마스터리·부스터에 투자합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Warrior",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "page": {
    "id": "page",
    "name": "페이지",
    "en": "Page",
    "family": "warrior",
    "tier": 2,
    "path": "초보자 → 전사 → 페이지",
    "color": "#bd8a69",
    "short": "페이지",
    "icon": "shield",
    "town": "페리온",
    "summary": "검 또는 둔기와 위협을 활용합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Warrior",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "spearman": {
    "id": "spearman",
    "name": "스피어맨",
    "en": "Spearman",
    "family": "warrior",
    "tier": 2,
    "path": "초보자 → 전사 → 스피어맨",
    "color": "#bd7652",
    "short": "창전사",
    "icon": "sword",
    "town": "페리온",
    "summary": "창·폴암 선택과 아이언 월을 비교합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Warrior",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "magician": {
    "id": "magician",
    "name": "마법사",
    "en": "Magician",
    "family": "magician",
    "tier": 1,
    "path": "초보자 → 마법사",
    "color": "#7c91c0",
    "short": "마법사",
    "icon": "wand",
    "town": "엘리니아",
    "summary": "INT 중심의 원거리 마법. HP와 MP 물약 비용을 함께 관리합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Magician",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference",
    "advancementNote": "Classic World의 현재 참조 자료는 마법사도 10레벨 전직입니다. 과거 메이플의 8레벨 전직 정보와 구분하세요."
  },
  "firePoison": {
    "id": "firePoison",
    "name": "위자드 (불·독)",
    "en": "Fire/Poison Wizard",
    "family": "magician",
    "tier": 2,
    "path": "초보자 → 마법사 → 위자드 (불·독)",
    "color": "#c9785e",
    "short": "불독",
    "icon": "wand",
    "town": "엘리니아",
    "summary": "불·독 속성과 지속 피해에 맞는 몬스터를 비교합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Magician",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference",
    "advancementNote": "Classic World의 현재 참조 자료는 마법사도 10레벨 전직입니다. 과거 메이플의 8레벨 전직 정보와 구분하세요."
  },
  "iceLightning": {
    "id": "iceLightning",
    "name": "위자드 (썬·콜)",
    "en": "Ice/Lightning Wizard",
    "family": "magician",
    "tier": 2,
    "path": "초보자 → 마법사 → 위자드 (썬·콜)",
    "color": "#6c9db9",
    "short": "썬콜",
    "icon": "wand",
    "town": "엘리니아",
    "summary": "얼음 제어와 번개 범위 공격을 활용합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Magician",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference",
    "advancementNote": "Classic World의 현재 참조 자료는 마법사도 10레벨 전직입니다. 과거 메이플의 8레벨 전직 정보와 구분하세요."
  },
  "cleric": {
    "id": "cleric",
    "name": "클레릭",
    "en": "Cleric",
    "family": "magician",
    "tier": 2,
    "path": "초보자 → 마법사 → 클레릭",
    "color": "#a18bbd",
    "short": "클레릭",
    "icon": "sparkles",
    "town": "엘리니아",
    "summary": "힐과 파티 지원, 언데드 상대 실측 효율을 비교합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Magician",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference",
    "advancementNote": "Classic World의 현재 참조 자료는 마법사도 10레벨 전직입니다. 과거 메이플의 8레벨 전직 정보와 구분하세요."
  },
  "bowman": {
    "id": "bowman",
    "name": "궁수",
    "en": "Bowman",
    "family": "bowman",
    "tier": 1,
    "path": "초보자 → 궁수",
    "color": "#69986b",
    "short": "궁수",
    "icon": "bow",
    "town": "헤네시스",
    "summary": "DEX 중심의 원거리 물리 공격. 활과 석궁의 진로를 고릅니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Bowman",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "hunter": {
    "id": "hunter",
    "name": "헌터",
    "en": "Hunter",
    "family": "bowman",
    "tier": 2,
    "path": "초보자 → 궁수 → 헌터",
    "color": "#69986b",
    "short": "활궁수",
    "icon": "bow",
    "town": "헤네시스",
    "summary": "활·애로우 봄과 사거리·지형을 함께 고려합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Bowman",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "crossbowman": {
    "id": "crossbowman",
    "name": "사수",
    "en": "Crossbowman",
    "family": "bowman",
    "tier": 2,
    "path": "초보자 → 궁수 → 사수",
    "color": "#5e8e84",
    "short": "석궁",
    "icon": "bow",
    "town": "헤네시스",
    "summary": "석궁·아이언 애로우와 직선 지형을 비교합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Bowman",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "thief": {
    "id": "thief",
    "name": "도적",
    "en": "Thief",
    "family": "thief",
    "tier": 1,
    "path": "초보자 → 도적",
    "color": "#8b79b9",
    "short": "도적",
    "icon": "sparkles",
    "town": "커닝시티",
    "summary": "LUK 중심. 표창과 단검의 진로를 고릅니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Thief",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "assassin": {
    "id": "assassin",
    "name": "어쌔신",
    "en": "Assassin",
    "family": "thief",
    "tier": 2,
    "path": "초보자 → 도적 → 어쌔신",
    "color": "#8b79b9",
    "short": "표도",
    "icon": "sparkles",
    "town": "커닝시티",
    "summary": "아대·표창을 사용하며 재충전·물약 비용을 계산합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Thief",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  },
  "bandit": {
    "id": "bandit",
    "name": "시프",
    "en": "Bandit",
    "family": "thief",
    "tier": 2,
    "path": "초보자 → 도적 → 시프",
    "color": "#a17fa5",
    "short": "단도",
    "icon": "sword",
    "town": "커닝시티",
    "summary": "단검·새비지 블로우와 접근·이동 시간을 함께 비교합니다.",
    "available": true,
    "firstAdvancementLevel": 10,
    "secondAdvancementLevel": 30,
    "thirdAdvancementAvailable": false,
    "sourceUrl": "https://mapleclassic.wiki/wiki/Skills/Thief",
    "verifiedAt": "2026-10-21",
    "confidence": "community-reference"
  }
};
export const JOB_IDS = Object.freeze(Object.keys(JOBS));
export const SKILLS = {
  "beginner": [
    {
      "id": "three-snails",
      "name": "달팽이 세 마리",
      "en": "Three Snails",
      "max": 3,
      "tier": 0,
      "mpCost": "3 → 5",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Three_Snails",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "nimble-feet",
      "name": "민첩한 몸놀림",
      "en": "Nimble Feet",
      "max": 3,
      "tier": 0,
      "mpCost": "4 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Nimble_Feet",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "recovery",
      "name": "회복",
      "en": "Recovery",
      "max": 3,
      "tier": 0,
      "mpCost": "5 → 15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "warrior": [
    {
      "id": "recovery",
      "name": "HP 회복력 향상",
      "en": "Improved HP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_HP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "slash",
      "name": "슬래시 블래스트",
      "en": "Slash Blast",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slash_Blast",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 130,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "power",
          "level": 1,
          "name": "파워 스트라이크"
        }
      ],
      "requires": {
        "id": "power",
        "level": 1,
        "name": "파워 스트라이크"
      }
    },
    {
      "id": "body",
      "name": "아이언 바디",
      "en": "Iron Body",
      "max": 20,
      "tier": 1,
      "mpCost": "15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "hp",
          "level": 3,
          "name": "최대 HP 증가"
        }
      ],
      "requires": {
        "id": "hp",
        "level": 3,
        "name": "최대 HP 증가"
      }
    },
    {
      "id": "precision",
      "name": "정밀 일격",
      "en": "Precise Strikes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Precise_Strikes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "hp",
      "name": "최대 HP 증가",
      "en": "Max HP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_HP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "recovery",
          "level": 3,
          "name": "HP 회복력 향상"
        }
      ],
      "requires": {
        "id": "recovery",
        "level": 3,
        "name": "HP 회복력 향상"
      }
    },
    {
      "id": "power",
      "name": "파워 스트라이크",
      "en": "Power Strike",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Strike",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 260,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "fighter": [
    {
      "id": "recovery",
      "name": "HP 회복력 향상",
      "en": "Improved HP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_HP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "slash",
      "name": "슬래시 블래스트",
      "en": "Slash Blast",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slash_Blast",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 130,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "power",
          "level": 1,
          "name": "파워 스트라이크"
        }
      ],
      "requires": {
        "id": "power",
        "level": 1,
        "name": "파워 스트라이크"
      }
    },
    {
      "id": "body",
      "name": "아이언 바디",
      "en": "Iron Body",
      "max": 20,
      "tier": 1,
      "mpCost": "15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "hp",
          "level": 3,
          "name": "최대 HP 증가"
        }
      ],
      "requires": {
        "id": "hp",
        "level": 3,
        "name": "최대 HP 증가"
      }
    },
    {
      "id": "precision",
      "name": "정밀 일격",
      "en": "Precise Strikes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Precise_Strikes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "hp",
      "name": "최대 HP 증가",
      "en": "Max HP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_HP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "recovery",
          "level": 3,
          "name": "HP 회복력 향상"
        }
      ],
      "requires": {
        "id": "recovery",
        "level": 3,
        "name": "HP 회복력 향상"
      }
    },
    {
      "id": "power",
      "name": "파워 스트라이크",
      "en": "Power Strike",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Strike",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 260,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "rush",
      "name": "러시",
      "en": "Rush",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Rush",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "rage",
      "name": "분노",
      "en": "Rage",
      "max": 30,
      "tier": 2,
      "mpCost": "10 → 25",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Rage",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "mastery",
      "name": "소드 마스터리",
      "en": "Sword Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Sword_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "booster",
      "name": "소드 부스터",
      "en": "Sword Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Sword_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 5,
          "name": "소드 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 5,
        "name": "소드 마스터리"
      }
    },
    {
      "id": "axe-mastery",
      "name": "액스 마스터리",
      "en": "Axe Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Axe_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "axe-booster",
      "name": "액스 부스터",
      "en": "Axe Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Axe_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "axe-mastery",
          "level": 5,
          "name": "액스 마스터리"
        }
      ],
      "requires": {
        "id": "axe-mastery",
        "level": 5,
        "name": "액스 마스터리"
      }
    },
    {
      "id": "final-attack-sword",
      "name": "파이널 어택 : 검",
      "en": "Final Attack: Sword",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Sword",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 3,
          "name": "소드 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 3,
        "name": "소드 마스터리"
      }
    },
    {
      "id": "final-attack-axe",
      "name": "파이널 어택 : 도끼",
      "en": "Final Attack: Axe",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Axe",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "axe-mastery",
          "level": 3,
          "name": "액스 마스터리"
        }
      ],
      "requires": {
        "id": "axe-mastery",
        "level": 3,
        "name": "액스 마스터리"
      }
    }
  ],
  "page": [
    {
      "id": "recovery",
      "name": "HP 회복력 향상",
      "en": "Improved HP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_HP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "slash",
      "name": "슬래시 블래스트",
      "en": "Slash Blast",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slash_Blast",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 130,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "power",
          "level": 1,
          "name": "파워 스트라이크"
        }
      ],
      "requires": {
        "id": "power",
        "level": 1,
        "name": "파워 스트라이크"
      }
    },
    {
      "id": "body",
      "name": "아이언 바디",
      "en": "Iron Body",
      "max": 20,
      "tier": 1,
      "mpCost": "15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "hp",
          "level": 3,
          "name": "최대 HP 증가"
        }
      ],
      "requires": {
        "id": "hp",
        "level": 3,
        "name": "최대 HP 증가"
      }
    },
    {
      "id": "precision",
      "name": "정밀 일격",
      "en": "Precise Strikes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Precise_Strikes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "hp",
      "name": "최대 HP 증가",
      "en": "Max HP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_HP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "recovery",
          "level": 3,
          "name": "HP 회복력 향상"
        }
      ],
      "requires": {
        "id": "recovery",
        "level": 3,
        "name": "HP 회복력 향상"
      }
    },
    {
      "id": "power",
      "name": "파워 스트라이크",
      "en": "Power Strike",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Strike",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 260,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "rush",
      "name": "러시",
      "en": "Rush",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Rush",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "blunt-weapon-mastery",
      "name": "블런트 마스터리",
      "en": "Blunt Weapon Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Blunt_Weapon_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "blunt-weapon-booster",
      "name": "블런트 부스터",
      "en": "Blunt Weapon Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Blunt_Weapon_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "blunt-weapon-mastery",
          "level": 5,
          "name": "블런트 마스터리"
        }
      ],
      "requires": {
        "id": "blunt-weapon-mastery",
        "level": 5,
        "name": "블런트 마스터리"
      }
    },
    {
      "id": "mastery",
      "name": "소드 마스터리",
      "en": "Sword Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Sword_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "booster",
      "name": "소드 부스터",
      "en": "Sword Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Sword_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 5,
          "name": "소드 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 5,
        "name": "소드 마스터리"
      }
    },
    {
      "id": "threaten",
      "name": "위협",
      "en": "Threaten",
      "max": 30,
      "tier": 2,
      "mpCost": "10 → 25",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Threaten",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "final-attack-sword",
      "name": "파이널 어택 : 검",
      "en": "Final Attack: Sword",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Sword",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 3,
          "name": "소드 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 3,
        "name": "소드 마스터리"
      }
    },
    {
      "id": "final-attack-blunt-weapon",
      "name": "파이널 어택 : 둔기",
      "en": "Final Attack: Blunt Weapon",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Blunt_Weapon",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "blunt-weapon-mastery",
          "level": 3,
          "name": "블런트 마스터리"
        }
      ],
      "requires": {
        "id": "blunt-weapon-mastery",
        "level": 3,
        "name": "블런트 마스터리"
      }
    }
  ],
  "spearman": [
    {
      "id": "recovery",
      "name": "HP 회복력 향상",
      "en": "Improved HP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_HP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "slash",
      "name": "슬래시 블래스트",
      "en": "Slash Blast",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slash_Blast",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 130,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "power",
          "level": 1,
          "name": "파워 스트라이크"
        }
      ],
      "requires": {
        "id": "power",
        "level": 1,
        "name": "파워 스트라이크"
      }
    },
    {
      "id": "body",
      "name": "아이언 바디",
      "en": "Iron Body",
      "max": 20,
      "tier": 1,
      "mpCost": "15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "hp",
          "level": 3,
          "name": "최대 HP 증가"
        }
      ],
      "requires": {
        "id": "hp",
        "level": 3,
        "name": "최대 HP 증가"
      }
    },
    {
      "id": "precision",
      "name": "정밀 일격",
      "en": "Precise Strikes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Precise_Strikes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "hp",
      "name": "최대 HP 증가",
      "en": "Max HP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_HP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "recovery",
          "level": 3,
          "name": "HP 회복력 향상"
        }
      ],
      "requires": {
        "id": "recovery",
        "level": 3,
        "name": "HP 회복력 향상"
      }
    },
    {
      "id": "power",
      "name": "파워 스트라이크",
      "en": "Power Strike",
      "max": 20,
      "tier": 1,
      "mpCost": "4 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Strike",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 260,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "rush",
      "name": "러시",
      "en": "Rush",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Rush",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "spear-mastery",
      "name": "스피어 마스터리",
      "en": "Spear Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Spear_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "spear-booster",
      "name": "스피어 부스터",
      "en": "Spear Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Spear_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "spear-mastery",
          "level": 5,
          "name": "스피어 마스터리"
        }
      ],
      "requires": {
        "id": "spear-mastery",
        "level": 5,
        "name": "스피어 마스터리"
      }
    },
    {
      "id": "iron-will",
      "name": "아이언 월",
      "en": "Iron Will",
      "max": 30,
      "tier": 2,
      "mpCost": "10 → 25",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Will",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "final-attack-spear",
      "name": "파이널 어택 : 창",
      "en": "Final Attack: Spear",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Spear",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "spear-mastery",
          "level": 3,
          "name": "스피어 마스터리"
        }
      ],
      "requires": {
        "id": "spear-mastery",
        "level": 3,
        "name": "스피어 마스터리"
      }
    },
    {
      "id": "final-attack-polearm",
      "name": "파이널 어택 : 폴암",
      "en": "Final Attack: Polearm",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Polearm",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "polearm-mastery",
          "level": 3,
          "name": "폴암 마스터리"
        }
      ],
      "requires": {
        "id": "polearm-mastery",
        "level": 3,
        "name": "폴암 마스터리"
      }
    },
    {
      "id": "polearm-mastery",
      "name": "폴암 마스터리",
      "en": "Polearm Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Polearm_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "polearm-booster",
      "name": "폴암 부스터",
      "en": "Polearm Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Polearm_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "polearm-mastery",
          "level": 5,
          "name": "폴암 마스터리"
        }
      ],
      "requires": {
        "id": "polearm-mastery",
        "level": 5,
        "name": "폴암 마스터리"
      }
    }
  ],
  "magician": [
    {
      "id": "improved-mp-recovery",
      "name": "MP 회복력 향상",
      "en": "Improved MP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_MP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-guard",
      "name": "매직 가드",
      "en": "Magic Guard",
      "max": 15,
      "tier": 1,
      "mpCost": "8 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Guard",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-armor",
      "name": "매직 아머",
      "en": "Magic Armor",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Armor",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "magic-guard",
          "level": 3,
          "name": "매직 가드"
        }
      ],
      "requires": {
        "id": "magic-guard",
        "level": 3,
        "name": "매직 가드"
      }
    },
    {
      "id": "magic-claw",
      "name": "매직 클로",
      "en": "Magic Claw",
      "max": 20,
      "tier": 1,
      "mpCost": "10 → 20",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Claw",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "energy-bolt",
          "level": 1,
          "name": "에너지 볼트"
        }
      ],
      "requires": {
        "id": "energy-bolt",
        "level": 1,
        "name": "에너지 볼트"
      }
    },
    {
      "id": "energy-bolt",
      "name": "에너지 볼트",
      "en": "Energy Bolt",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Energy_Bolt",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "max-mp-increase",
      "name": "최대 MP 증가",
      "en": "Max MP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_MP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "improved-mp-recovery",
          "level": 3,
          "name": "MP 회복력 향상"
        }
      ],
      "requires": {
        "id": "improved-mp-recovery",
        "level": 3,
        "name": "MP 회복력 향상"
      }
    }
  ],
  "firePoison": [
    {
      "id": "improved-mp-recovery",
      "name": "MP 회복력 향상",
      "en": "Improved MP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_MP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-guard",
      "name": "매직 가드",
      "en": "Magic Guard",
      "max": 15,
      "tier": 1,
      "mpCost": "8 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Guard",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-armor",
      "name": "매직 아머",
      "en": "Magic Armor",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Armor",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "magic-guard",
          "level": 3,
          "name": "매직 가드"
        }
      ],
      "requires": {
        "id": "magic-guard",
        "level": 3,
        "name": "매직 가드"
      }
    },
    {
      "id": "magic-claw",
      "name": "매직 클로",
      "en": "Magic Claw",
      "max": 20,
      "tier": 1,
      "mpCost": "10 → 20",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Claw",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "energy-bolt",
          "level": 1,
          "name": "에너지 볼트"
        }
      ],
      "requires": {
        "id": "energy-bolt",
        "level": 1,
        "name": "에너지 볼트"
      }
    },
    {
      "id": "energy-bolt",
      "name": "에너지 볼트",
      "en": "Energy Bolt",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Energy_Bolt",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "max-mp-increase",
      "name": "최대 MP 증가",
      "en": "Max MP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_MP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "improved-mp-recovery",
          "level": 3,
          "name": "MP 회복력 향상"
        }
      ],
      "requires": {
        "id": "improved-mp-recovery",
        "level": 3,
        "name": "MP 회복력 향상"
      }
    },
    {
      "id": "mp-eater",
      "name": "MP 이터",
      "en": "MP Eater",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/MP_Eater",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "meditation",
      "name": "메디테이션",
      "en": "Meditation",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 25",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Meditation",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mp-eater",
          "level": 3,
          "name": "MP 이터"
        }
      ],
      "requires": {
        "id": "mp-eater",
        "level": 3,
        "name": "MP 이터"
      }
    },
    {
      "id": "slow",
      "name": "슬로우",
      "en": "Slow",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 8",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "teleport",
          "level": 5,
          "name": "텔레포트"
        }
      ],
      "requires": {
        "id": "teleport",
        "level": 5,
        "name": "텔레포트"
      }
    },
    {
      "id": "teleport",
      "name": "텔레포트",
      "en": "Teleport",
      "max": 20,
      "tier": 2,
      "mpCost": "55 → 15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Teleport",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "fire-arrow",
      "name": "파이어 애로우",
      "en": "Fire Arrow",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Fire_Arrow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": "Fire",
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "poison-breath",
      "name": "포이즌 브레스",
      "en": "Poison Breath",
      "max": 30,
      "tier": 2,
      "mpCost": "20 → 40",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Poison_Breath",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": "Poison",
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "iceLightning": [
    {
      "id": "improved-mp-recovery",
      "name": "MP 회복력 향상",
      "en": "Improved MP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_MP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-guard",
      "name": "매직 가드",
      "en": "Magic Guard",
      "max": 15,
      "tier": 1,
      "mpCost": "8 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Guard",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-armor",
      "name": "매직 아머",
      "en": "Magic Armor",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Armor",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "magic-guard",
          "level": 3,
          "name": "매직 가드"
        }
      ],
      "requires": {
        "id": "magic-guard",
        "level": 3,
        "name": "매직 가드"
      }
    },
    {
      "id": "magic-claw",
      "name": "매직 클로",
      "en": "Magic Claw",
      "max": 20,
      "tier": 1,
      "mpCost": "10 → 20",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Claw",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "energy-bolt",
          "level": 1,
          "name": "에너지 볼트"
        }
      ],
      "requires": {
        "id": "energy-bolt",
        "level": 1,
        "name": "에너지 볼트"
      }
    },
    {
      "id": "energy-bolt",
      "name": "에너지 볼트",
      "en": "Energy Bolt",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Energy_Bolt",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "max-mp-increase",
      "name": "최대 MP 증가",
      "en": "Max MP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_MP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "improved-mp-recovery",
          "level": 3,
          "name": "MP 회복력 향상"
        }
      ],
      "requires": {
        "id": "improved-mp-recovery",
        "level": 3,
        "name": "MP 회복력 향상"
      }
    },
    {
      "id": "mp-eater",
      "name": "MP 이터",
      "en": "MP Eater",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/MP_Eater",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "meditation",
      "name": "메디테이션",
      "en": "Meditation",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 25",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Meditation",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mp-eater",
          "level": 3,
          "name": "MP 이터"
        }
      ],
      "requires": {
        "id": "mp-eater",
        "level": 3,
        "name": "MP 이터"
      }
    },
    {
      "id": "thunder-bolt",
      "name": "선더 볼트",
      "en": "Thunder Bolt",
      "max": 30,
      "tier": 2,
      "mpCost": "20 → 40",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Thunder_Bolt",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 6,
        "element": "Lightning",
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "slow",
      "name": "슬로우",
      "en": "Slow",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 8",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Slow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "teleport",
          "level": 5,
          "name": "텔레포트"
        }
      ],
      "requires": {
        "id": "teleport",
        "level": 5,
        "name": "텔레포트"
      }
    },
    {
      "id": "cold-beam",
      "name": "콜드 빔",
      "en": "Cold Beam",
      "max": 30,
      "tier": 2,
      "mpCost": "11 → 22",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Cold_Beam",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": "Ice",
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "teleport",
      "name": "텔레포트",
      "en": "Teleport",
      "max": 20,
      "tier": 2,
      "mpCost": "55 → 15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Teleport",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "cleric": [
    {
      "id": "improved-mp-recovery",
      "name": "MP 회복력 향상",
      "en": "Improved MP Recovery",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Improved_MP_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-guard",
      "name": "매직 가드",
      "en": "Magic Guard",
      "max": 15,
      "tier": 1,
      "mpCost": "8 → 12",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Guard",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "magic-armor",
      "name": "매직 아머",
      "en": "Magic Armor",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Armor",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "magic-guard",
          "level": 3,
          "name": "매직 가드"
        }
      ],
      "requires": {
        "id": "magic-guard",
        "level": 3,
        "name": "매직 가드"
      }
    },
    {
      "id": "magic-claw",
      "name": "매직 클로",
      "en": "Magic Claw",
      "max": 20,
      "tier": 1,
      "mpCost": "10 → 20",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Magic_Claw",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "energy-bolt",
          "level": 1,
          "name": "에너지 볼트"
        }
      ],
      "requires": {
        "id": "energy-bolt",
        "level": 1,
        "name": "에너지 볼트"
      }
    },
    {
      "id": "energy-bolt",
      "name": "에너지 볼트",
      "en": "Energy Bolt",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Energy_Bolt",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "max-mp-increase",
      "name": "최대 MP 증가",
      "en": "Max MP Increase",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Max_MP_Increase",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "improved-mp-recovery",
          "level": 3,
          "name": "MP 회복력 향상"
        }
      ],
      "requires": {
        "id": "improved-mp-recovery",
        "level": 3,
        "name": "MP 회복력 향상"
      }
    },
    {
      "id": "mp-eater",
      "name": "MP 이터",
      "en": "MP Eater",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/MP_Eater",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "bless",
      "name": "블레스",
      "en": "Bless",
      "max": 20,
      "tier": 2,
      "mpCost": "20 → 30",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Bless",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "invincible",
          "level": 5,
          "name": "인빈서블"
        }
      ],
      "requires": {
        "id": "invincible",
        "level": 5,
        "name": "인빈서블"
      }
    },
    {
      "id": "invincible",
      "name": "인빈서블",
      "en": "Invincible",
      "max": 20,
      "tier": 2,
      "mpCost": "16 → 36",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Invincible",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "heal",
          "level": 5,
          "name": "힐"
        }
      ],
      "requires": {
        "id": "heal",
        "level": 5,
        "name": "힐"
      }
    },
    {
      "id": "teleport",
      "name": "텔레포트",
      "en": "Teleport",
      "max": 20,
      "tier": 2,
      "mpCost": "55 → 15",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Teleport",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "holy-arrow",
      "name": "홀리 애로우",
      "en": "Holy Arrow",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Holy_Arrow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": 1,
        "targets": 3,
        "element": "Holy",
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "heal",
      "name": "힐",
      "en": "Heal",
      "max": 30,
      "tier": 2,
      "mpCost": "12 → 27",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Heal",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "bowman": [
    {
      "id": "double",
      "name": "더블 샷",
      "en": "Double Shot",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 2,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "arrow",
          "level": 1,
          "name": "애로우 블로우"
        }
      ],
      "requires": {
        "id": "arrow",
        "level": 1,
        "name": "애로우 블로우"
      }
    },
    {
      "id": "eye",
      "name": "아마존의 눈",
      "en": "The Eye of Amazon",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/The_Eye_of_Amazon",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "arrow",
      "name": "애로우 블로우",
      "en": "Arrow Blow",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Arrow_Blow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 240,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "critical",
      "name": "크리티컬 샷",
      "en": "Critical Shot",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Critical_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "power",
      "name": "파워 넉백",
      "en": "Power Knockback",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Knockback",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "focus",
      "name": "포커스",
      "en": "Focus",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Focus",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "eye",
          "level": 3,
          "name": "아마존의 눈"
        }
      ],
      "requires": {
        "id": "eye",
        "level": 3,
        "name": "아마존의 눈"
      }
    }
  ],
  "hunter": [
    {
      "id": "double",
      "name": "더블 샷",
      "en": "Double Shot",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 2,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "arrow",
          "level": 1,
          "name": "애로우 블로우"
        }
      ],
      "requires": {
        "id": "arrow",
        "level": 1,
        "name": "애로우 블로우"
      }
    },
    {
      "id": "eye",
      "name": "아마존의 눈",
      "en": "The Eye of Amazon",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/The_Eye_of_Amazon",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "arrow",
      "name": "애로우 블로우",
      "en": "Arrow Blow",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Arrow_Blow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 240,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "critical",
      "name": "크리티컬 샷",
      "en": "Critical Shot",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Critical_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "power",
      "name": "파워 넉백",
      "en": "Power Knockback",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Knockback",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "focus",
      "name": "포커스",
      "en": "Focus",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Focus",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "eye",
          "level": 3,
          "name": "아마존의 눈"
        }
      ],
      "requires": {
        "id": "eye",
        "level": 3,
        "name": "아마존의 눈"
      }
    },
    {
      "id": "mastery",
      "name": "보우 마스터리",
      "en": "Bow Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Bow_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "booster",
      "name": "보우 부스터",
      "en": "Bow Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Bow_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 5,
          "name": "보우 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 5,
        "name": "보우 마스터리"
      }
    },
    {
      "id": "soul-arrow-bow",
      "name": "소울 애로우 : 활",
      "en": "Soul Arrow: Bow",
      "max": 20,
      "tier": 2,
      "mpCost": "25 → 5",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Soul_Arrow:_Bow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "booster",
          "level": 5,
          "name": "보우 부스터"
        }
      ],
      "requires": {
        "id": "booster",
        "level": 5,
        "name": "보우 부스터"
      }
    },
    {
      "id": "amazon-s-judgement",
      "name": "아마존의 심판",
      "en": "Amazon's Judgement",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Amazon's_Judgement",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "bomb",
      "name": "애로우 봄 : 활",
      "en": "Arrow Bomb: Bow",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Arrow_Bomb:_Bow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "final-attack-bow",
      "name": "파이널 어택 : 활",
      "en": "Final Attack: Bow",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Bow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 3,
          "name": "보우 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 3,
        "name": "보우 마스터리"
      }
    }
  ],
  "crossbowman": [
    {
      "id": "double",
      "name": "더블 샷",
      "en": "Double Shot",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 2,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "arrow",
          "level": 1,
          "name": "애로우 블로우"
        }
      ],
      "requires": {
        "id": "arrow",
        "level": 1,
        "name": "애로우 블로우"
      }
    },
    {
      "id": "eye",
      "name": "아마존의 눈",
      "en": "The Eye of Amazon",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/The_Eye_of_Amazon",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "arrow",
      "name": "애로우 블로우",
      "en": "Arrow Blow",
      "max": 20,
      "tier": 1,
      "mpCost": "6 → 14",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Arrow_Blow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 240,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "critical",
      "name": "크리티컬 샷",
      "en": "Critical Shot",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Critical_Shot",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "power",
      "name": "파워 넉백",
      "en": "Power Knockback",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Power_Knockback",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "focus",
      "name": "포커스",
      "en": "Focus",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Focus",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "eye",
          "level": 3,
          "name": "아마존의 눈"
        }
      ],
      "requires": {
        "id": "eye",
        "level": 3,
        "name": "아마존의 눈"
      }
    },
    {
      "id": "soul-arrow-crossbow",
      "name": "소울 애로우 : 석궁",
      "en": "Soul Arrow: Crossbow",
      "max": 20,
      "tier": 2,
      "mpCost": "25 → 5",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Soul_Arrow:_Crossbow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "crossbow-booster",
          "level": 5,
          "name": "크로스보우 부스터"
        }
      ],
      "requires": {
        "id": "crossbow-booster",
        "level": 5,
        "name": "크로스보우 부스터"
      }
    },
    {
      "id": "amazon-s-judgement",
      "name": "아마존의 심판",
      "en": "Amazon's Judgement",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Amazon's_Judgement",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "iron-arrow-crossbow",
      "name": "아이언 애로우 : 석궁",
      "en": "Iron Arrow: Crossbow",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Iron_Arrow:_Crossbow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 190,
        "hits": 1,
        "targets": 4,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "crossbow-mastery",
      "name": "크로스보우 마스터리",
      "en": "Crossbow Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Crossbow_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "crossbow-booster",
      "name": "크로스보우 부스터",
      "en": "Crossbow Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Crossbow_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "crossbow-mastery",
          "level": 5,
          "name": "크로스보우 마스터리"
        }
      ],
      "requires": {
        "id": "crossbow-mastery",
        "level": 5,
        "name": "크로스보우 마스터리"
      }
    },
    {
      "id": "final-attack-crossbow",
      "name": "파이널 어택 : 석궁",
      "en": "Final Attack: Crossbow",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Final_Attack:_Crossbow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "crossbow-mastery",
          "level": 3,
          "name": "크로스보우 마스터리"
        }
      ],
      "requires": {
        "id": "crossbow-mastery",
        "level": 3,
        "name": "크로스보우 마스터리"
      }
    }
  ],
  "thief": [
    {
      "id": "nimble",
      "name": "님블 바디",
      "en": "Nimble Body",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Nimble_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "dark",
      "name": "다크 사이트",
      "en": "Dark Sight",
      "max": 20,
      "tier": 1,
      "mpCost": "50 → 30",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Dark_Sight",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "disorder",
          "level": 3,
          "name": "디스오더"
        }
      ],
      "requires": {
        "id": "disorder",
        "level": 3,
        "name": "디스오더"
      }
    },
    {
      "id": "double",
      "name": "더블 스탭",
      "en": "Double Stab",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Stab",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 160,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "disorder",
      "name": "디스오더",
      "en": "Disorder",
      "max": 20,
      "tier": 1,
      "mpCost": "5 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Disorder",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 100,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "lucky",
      "name": "럭키 세븐",
      "en": "Lucky Seven",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Lucky_Seven",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "keen",
      "name": "킨 아이즈",
      "en": "Keen Eyes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Keen_Eyes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "nimble",
          "level": 3,
          "name": "님블 바디"
        }
      ],
      "requires": {
        "id": "nimble",
        "level": 3,
        "name": "님블 바디"
      }
    }
  ],
  "assassin": [
    {
      "id": "nimble",
      "name": "님블 바디",
      "en": "Nimble Body",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Nimble_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "dark",
      "name": "다크 사이트",
      "en": "Dark Sight",
      "max": 20,
      "tier": 1,
      "mpCost": "50 → 30",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Dark_Sight",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "disorder",
          "level": 3,
          "name": "디스오더"
        }
      ],
      "requires": {
        "id": "disorder",
        "level": 3,
        "name": "디스오더"
      }
    },
    {
      "id": "double",
      "name": "더블 스탭",
      "en": "Double Stab",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Stab",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 160,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "disorder",
      "name": "디스오더",
      "en": "Disorder",
      "max": 20,
      "tier": 1,
      "mpCost": "5 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Disorder",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 100,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "lucky",
      "name": "럭키 세븐",
      "en": "Lucky Seven",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Lucky_Seven",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "keen",
      "name": "킨 아이즈",
      "en": "Keen Eyes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Keen_Eyes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "nimble",
          "level": 3,
          "name": "님블 바디"
        }
      ],
      "requires": {
        "id": "nimble",
        "level": 3,
        "name": "님블 바디"
      }
    },
    {
      "id": "drain",
      "name": "드레인",
      "en": "Drain",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Drain",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 240,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "critical-recovery",
          "level": 3,
          "name": "크리티컬 리커버리"
        }
      ],
      "requires": {
        "id": "critical-recovery",
        "level": 3,
        "name": "크리티컬 리커버리"
      }
    },
    {
      "id": "mastery",
      "name": "자벨린 마스터리",
      "en": "Claw Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Claw_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "booster",
      "name": "자벨린 부스터",
      "en": "Claw Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Claw_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 5,
          "name": "자벨린 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 5,
        "name": "자벨린 마스터리"
      }
    },
    {
      "id": "critical-recovery",
      "name": "크리티컬 리커버리",
      "en": "Critical Recovery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Critical_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "critical",
      "name": "크리티컬 스로우",
      "en": "Critical Throw",
      "max": 30,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Critical_Throw",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "mastery",
          "level": 3,
          "name": "자벨린 마스터리"
        }
      ],
      "requires": {
        "id": "mastery",
        "level": 3,
        "name": "자벨린 마스터리"
      }
    },
    {
      "id": "haste",
      "name": "헤이스트",
      "en": "Haste",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 35",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Haste",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ],
  "bandit": [
    {
      "id": "nimble",
      "name": "님블 바디",
      "en": "Nimble Body",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Nimble_Body",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "dark",
      "name": "다크 사이트",
      "en": "Dark Sight",
      "max": 20,
      "tier": 1,
      "mpCost": "50 → 30",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Dark_Sight",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "disorder",
          "level": 3,
          "name": "디스오더"
        }
      ],
      "requires": {
        "id": "disorder",
        "level": 3,
        "name": "디스오더"
      }
    },
    {
      "id": "double",
      "name": "더블 스탭",
      "en": "Double Stab",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Double_Stab",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 160,
        "hits": 2,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "disorder",
      "name": "디스오더",
      "en": "Disorder",
      "max": 20,
      "tier": 1,
      "mpCost": "5 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Disorder",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 100,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "lucky",
      "name": "럭키 세븐",
      "en": "Lucky Seven",
      "max": 20,
      "tier": 1,
      "mpCost": "8 → 16",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Lucky_Seven",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 120,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "keen",
      "name": "킨 아이즈",
      "en": "Keen Eyes",
      "max": 15,
      "tier": 1,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Keen_Eyes",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "nimble",
          "level": 3,
          "name": "님블 바디"
        }
      ],
      "requires": {
        "id": "nimble",
        "level": 3,
        "name": "님블 바디"
      }
    },
    {
      "id": "nimble-recovery",
      "name": "님블 리커버리",
      "en": "Nimble Recovery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Nimble_Recovery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "dagger-mastery",
      "name": "대거 마스터리",
      "en": "Dagger Mastery",
      "max": 20,
      "tier": 2,
      "mpCost": null,
      "sourceUrl": "https://mapleclassic.wiki/wiki/Dagger_Mastery",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "dagger-booster",
      "name": "대거 부스터",
      "en": "Dagger Booster",
      "max": 20,
      "tier": 2,
      "mpCost": "30 → 10",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Dagger_Booster",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "dagger-mastery",
          "level": 5,
          "name": "대거 마스터리"
        }
      ],
      "requires": {
        "id": "dagger-mastery",
        "level": 5,
        "name": "대거 마스터리"
      }
    },
    {
      "id": "savage-blow",
      "name": "새비지 블로우",
      "en": "Savage Blow",
      "max": 30,
      "tier": 2,
      "mpCost": "14 → 28",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Savage_Blow",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 75,
        "hits": 6,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    },
    {
      "id": "steal",
      "name": "스틸",
      "en": "Steal",
      "max": 30,
      "tier": 2,
      "mpCost": "10 → 24",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Steal",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": 200,
        "hits": 1,
        "targets": 1,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      },
      "prerequisites": [
        {
          "id": "haste",
          "level": 5,
          "name": "헤이스트"
        }
      ],
      "requires": {
        "id": "haste",
        "level": 5,
        "name": "헤이스트"
      }
    },
    {
      "id": "haste",
      "name": "헤이스트",
      "en": "Haste",
      "max": 20,
      "tier": 2,
      "mpCost": "15 → 35",
      "sourceUrl": "https://mapleclassic.wiki/wiki/Haste",
      "verifiedAt": "2026-10-21",
      "confidence": "community-reference",
      "effects": {
        "damagePercent": null,
        "hits": null,
        "targets": null,
        "element": null,
        "scope": "요약 참조값 · 레벨별 효과표 아님"
      }
    }
  ]
};
export const FUTURE_JOBS = [
  {
    "name": "3차·4차 전직",
    "available": false,
    "note": "출시 버전에서 제공되지 않으며 과거 메이플 수치로 계산하지 않습니다."
  },
  {
    "name": "해적 계열",
    "available": false,
    "note": "현재 출시 직업 목록에 없습니다."
  }
];
export function getJobFamily(id) { return JOBS[id]?.family || "beginner"; }
