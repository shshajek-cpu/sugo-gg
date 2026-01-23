# 디자인 색상 가이드

SUGO.gg 프로젝트의 디자인 색상 팔레트입니다.

## 배경 (Background)
| 용도 | 색상 | HEX |
|------|------|-----|
| 메인 배경 | ⬛ | `#000000` |
| 서브 배경 | ⬛ | `#0a0a0a` |
| 카드 배경 | ⬛ | `#111111` |

## 테두리 (Border)
| 용도 | 색상 | HEX |
|------|------|-----|
| 기본 | ⬛ | `#222222` |
| 강조 | ⬛ | `#333333` |

## 포인트 (Accent)
| 용도 | 색상 | HEX |
|------|------|-----|
| 주황 (메인) | 🟠 | `#f59e0b` |
| 보라 (소량) | 🟣 | `#A78BFA` |

## 텍스트 (Text)
| 용도 | 색상 | HEX |
|------|------|-----|
| 메인 | ⬜ | `#E5E7EB` |
| 보조 | 🔘 | `#9CA3AF` |
| 비활성 | 🔘 | `#6B7280` |

## 종족 (Faction)
| 용도 | 색상 | HEX |
|------|------|-----|
| 천족 | 🟢 | `#2DD4BF` |
| 마족 | 🟣 | `#A78BFA` |

## 상태 (Status)
| 용도 | 색상 | HEX |
|------|------|-----|
| 에러 | 🔴 | `#ef4444` |
| 정보 | 🔵 | `#3b82f6` |
| 성공 | 🟢 | `#10B981` |

## CSS 변수 사용 예시
```css
/* 모바일에서는 CSS 변수 대신 직접 색상값 사용 */
background: #111;
border: 1px solid #222;
color: #E5E7EB;
```

## 자주 사용하는 조합
```css
/* 카드 스타일 */
background: #111;
border: 1px solid #222;
border-radius: 8px;

/* 버튼 (Primary) */
background: #f59e0b;
color: #000;

/* 버튼 (Secondary) */
background: #222;
color: #E5E7EB;
border: 1px solid #333;

/* 천족 버튼 */
background: #2DD4BF;
color: #000;

/* 마족 버튼 */
background: #A78BFA;
color: #000;
```
