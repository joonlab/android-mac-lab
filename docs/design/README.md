# 폴드 패밀리 디자인 가이드

이 랩의 안드로이드 앱 7개(ClipBridge · 사이버덱 · foldmic · 폴드 에이전트 · Claude 기록 · 핀백 · cmux 모바일 관제실)를 한 제품군처럼 보이게 맞춘 규칙입니다. 2026년 9월 27일에 이미 있던 세 앱(관제실·기록·에이전트)의 코드와 화면을 읽어 공통점을 뽑고, ClipBridge와 foldmic 화면을 Compose로 다시 짜면서 정리했습니다.

> **English** — The shared UI grammar for the lab's seven Android apps: 10 color roles + 3 semantic colors with one accent per app, a Pretendard type scale, flat bordered surfaces, and Galaxy Z Fold8 posture rules (cover / unfolded / tabletop). Contrast numbers are computed with the WCAG 2.x formula, not measured on the device.

![7개 앱 아이콘 패밀리 — 큰 아이콘과 작은 크기·단색(테마 아이콘) 미리보기](icon-family.png)

왼쪽부터 ClipBridge · 사이버덱 · foldmic · 폴드 에이전트 · Claude 기록 · 핀백 · cmux 모바일 관제실. 각 아이콘 아래는 작은 크기와 One UI 테마 아이콘(단색)으로 봤을 때입니다.

## 0. 한눈에 — 패밀리 문법 12조

1. **색은 역할 10개** + 의미색 3개(ok · warn · danger). 앱마다 바뀌는 건 **accent 하나**입니다. 화면 코드에 색 리터럴을 쓰지 않습니다.
2. **면은 평평합니다.** 그림자·elevation 없음. 카드 = `panel` 면 + **1dp `border`** + 둥근 모서리. 강조는 면을 accent나 의미색으로 **물들이기**(α .10~.17)로 합니다.
3. **켜짐 = accent 채움, 선택 = accentTint 면 + accent 테두리.** 꺼짐 = `panel`/`bg` 면 + `border` 테두리.
4. **글꼴은 Pretendard 하나.** 입력칸은 **16sp 이상**(작으면 폰이 확대합니다).
5. **머리줄(56dp)**: 왼쪽에 표식 + 앱 이름, 오른쪽 끝에 **테마 버튼**(시스템 → 밝게 → 어둡게, 시스템이면 「자동」 글자).
6. **터치 타깃 44dp 이상**(목표 48dp). 32~34dp 칩은 쓰지 않습니다.
7. **상태는 글로 드러냅니다.** 점·아이콘 + 한국어 한 줄(「수신 서버 동작 중 · 3초 전 받음」). 색만으로 상태를 말하지 않습니다.
8. **빈 화면·오류·로딩은 항상 문장으로.** 오류에는 원인 추정과 다음 행동 버튼을 붙입니다.
9. **엣지투엣지**: `enableEdgeToEdge()` + 뿌리에서 인셋 처리. 화면당 세로 스크롤은 하나.
10. **폴드 자세**: 폭 600dp 미만 = 1칸, 이상 = 2칸(또는 가운데 정렬 최대 폭). 접고 펴도 상태가 날아가지 않게 `configChanges`.
11. **아이콘은 lucide 선 아이콘(24 격자, 선 2, 둥근 끝) 벡터 경로**를 코드에 둡니다. 유니코드 글리프(‹ ✓ ▸ ⚠)나 이모지로 아이콘을 대신하지 않습니다.
12. **모든 아이콘 버튼에 `onClickLabel`/`contentDescription`** — TalkBack이 읽을 이름을 줍니다.

## 1. 색

### 1-1. 역할(모든 앱 공통)

| 역할 | 쓰는 곳 | 기준 |
|---|---|---|
| `bg` | 화면 바탕, 머리줄, 입력줄 바탕 | 가장 바깥 면 |
| `panel` | 카드 면, 사이드바, 레일 | bg보다 한 단계 |
| `panel2` | 입력칸 면, 스티키 머리, 세그먼트 바탕, 숫자 알약 | panel보다 한 단계 |
| `raised` | 대화상자·드롭다운·스낵바(떠 있는 것) | 라이트에선 흰색 |
| `border` | 모든 1dp 선, 구분선 | 대비 1.3~1.6 (장식선) |
| `text` | 본문·제목 | bg 대비 ≥ 15 |
| `dim` | 메타·설명·비활성 라벨·자리표시 | bg 대비 ≥ 4.5 (작은 글자에 쓰므로) |
| `accent` | 켜짐·선택·주 버튼·링크 | bg 위 글자로도 쓰므로 ≥ 4.5 |
| `accentTint` | 선택된 칩·줄의 면, 진행 중 카드 물듦 | accent α .10~.16 |
| `onAccent` | accent로 채운 면 위의 글자·아이콘 | accent 대비 ≥ 4.5 |

바탕은 완전한 무채색이 아니라 **accent 쪽으로 아주 살짝 기운 중성색**입니다. 앱마다 accent가 다르면 바탕의 기운도 따라가서, 같은 제품군인데 앱이 다르다는 인상이 생깁니다.

다크 테마에서 accent가 밝으면 **onAccent는 흰색이 아니라 짙은 색**을 씁니다. 흰 글자를 밝은 accent 위에 올리면 대비가 3.8~3.9로 떨어져 본문 기준(4.5)을 못 넘습니다.

### 1-2. 앱별 accent

| 앱 | 라이트 accent | 다크 accent | 다크 onAccent | 아이콘 그라데이션 |
|---|---|---|---|---|
| ClipBridge | `#0F766E` | `#5EEAD4` | `#042F2A` | `#6EE7B7 → #0D9488` |
| foldmic | `#6D28D9` | `#A78BFA` | `#1A0B3D` | `#C4B5FD → #7C3AED` |
| 폴드 에이전트 | `#D93A40` | `#E5484D` | `#FFFFFF`(→ 짙은 색 권장) | `#FFB38A → #E5484D` |
| Claude 기록 | `#A50034` | `#E14C74` | `#FFFFFF`(→ 짙은 색 권장) | `#F58FAE → #A50034` |
| cmux 모바일 관제실 | `#0F5132` | `#3CC492` | `#03150E` | `#4FC3F7 → #5B5BEA` |
| 핀백 | `#1D4ED8` | `#60A5FA` | `#0A1B33` | `#60A5FA → #1D4ED8` |
| 사이버덱 | `#4D7C0F` | `#A3E635` | `#1A2E05` | `#D9F99D → #65A30D` |

사이버덱의 화면 accent는 가이드를 쓸 때 대상이 아니어서, 아이콘 색에서 같은 규칙으로 유도한 값입니다(목업에 쓰는 값).

라이트 accent는 흰 바탕 대비 4.5를 넘기려고 아이콘 색보다 한 단계 진하게 옮긴 값입니다. 예를 들어 ClipBridge 아이콘의 `#0D9488` 은 흰 바탕에서 3.74라 글자로 못 쓰고, 화면에서는 `#0F766E`(5.26)를 씁니다.

### 1-3. 전체 표 예 — ClipBridge (틸)

| 역할 | 라이트 | 다크 |
|---|---|---|
| bg | `#F8FBFA` | `#0A0F0E` |
| panel | `#EFF5F3` | `#101816` |
| panel2 | `#E3ECE9` | `#17211E` |
| raised | `#FFFFFF` | `#1B2623` |
| border | `#CFDDD8` | `#263430` |
| text | `#0F1F1B` | `#E4EFEB` |
| dim | `#4F605B` | `#93A5A0` |
| accent | `#0F766E` | `#5EEAD4` |
| accentTint | accent α.10 | accent α.14 |
| onAccent | `#FFFFFF` | `#042F2A` |

계산한 대비: text/bg 16.4 · 16.4, dim/bg 6.39 · 7.48, accent/bg 5.26 · 13.05, onAccent/accent 5.47 · 9.82, accent/accentTint 4.60 · 9.73. 라이트의 accentTint를 α.12로 올리면 4.46으로 기준 아래가 되므로 α.10으로 고정했습니다.

### 1-4. 전체 표 예 — foldmic (바이올렛)

| 역할 | 라이트 | 다크 |
|---|---|---|
| bg | `#FAF9FC` | `#0D0C12` |
| panel | `#F3F1F8` | `#14121B` |
| panel2 | `#E9E6F2` | `#1C1926` |
| raised | `#FFFFFF` | `#211E2C` |
| border | `#D8D4E6` | `#2E2A3B` |
| text | `#1A1726` | `#ECEAF3` |
| dim | `#5C5870` | `#A29EB4` |
| accent | `#6D28D9` | `#A78BFA` |
| accentTint | accent α.10 | accent α.16 |
| onAccent | `#FFFFFF` | `#1A0B3D` |

### 1-5. 의미색(모든 앱 공통)

| 역할 | 라이트 | 다크 |
|---|---|---|
| ok | `#1A7F3C` | `#5ED18A` |
| warn | `#8A6100` | `#D9AE45` |
| warnText (호박 물듦 위 글자) | `#6B4C00` | `#E6C97E` |
| danger | `#C4322C` | `#EF6157` |

의미색은 **면 물들이기와 작은 아이콘·점**에만 씁니다. 제목 글자를 의미색으로 칠하지 않습니다. ClipBridge처럼 accent(틸)와 ok(초록)가 가까운 앱은 「연결됨·동작 중」은 ok 점 + 글자로, 「켜짐 스위치·주 버튼」은 accent로 역할을 나눠 섞지 않습니다.

### 1-6. 코드 모양

테마를 바꾸면 읽은 자리만 다시 그려지도록, getter로 테마 상태를 읽는 object로 둡니다.

```kotlin
object P : Pal {
    private fun t(l: Long, d: Long) = Color(if (ThemeMode.dark) d else l)
    override val bg get() = t(0xFFF8FBFA, 0xFF0A0F0E)
    override val panel get() = t(0xFFEFF5F3, 0xFF101816)
    override val panel2 get() = t(0xFFE3ECE9, 0xFF17211E)
    override val raised get() = t(0xFFFFFFFF, 0xFF1B2623)
    override val border get() = t(0xFFCFDDD8, 0xFF263430)
    override val text get() = t(0xFF0F1F1B, 0xFFE4EFEB)
    override val dim get() = t(0xFF4F605B, 0xFF93A5A0)
    override val accent get() = t(0xFF0F766E, 0xFF5EEAD4)
    override val accentTint get() = accent.copy(alpha = if (ThemeMode.dark) .14f else .10f)
    override val onAccent get() = t(0xFFFFFFFF, 0xFF042F2A)
    val ok get() = t(0xFF1A7F3C, 0xFF5ED18A)
    val warn get() = t(0xFF8A6100, 0xFFD9AE45)
    val warnText get() = t(0xFF6B4C00, 0xFFE6C97E)
    val danger get() = t(0xFFC4322C, 0xFFEF6157)
}
```

## 2. 타이포 스케일

전부 `sp`, 글꼴은 Pretendard입니다.

| 이름 | 크기 / 행간 | 굵기 | 쓰는 곳 |
|---|---|---|---|
| appTitle | 20 / 26, 자간 −0.2 | Bold | 머리줄 앱 이름 |
| sheetTitle | 17 / 24 | Bold | 시트·대화상자 제목 |
| hero | 22 / 28 | Bold | 한 화면의 핵심 상태 한 단어(foldmic 「켜짐」) |
| cardTitle | 15 / 21 | SemiBold | 카드·설정 줄 제목 |
| sectionHead | 14 / 20 | Bold | 목록 묶음 머리(「나를 기다림 2개」) |
| sectionLabel | 12 / 16 | SemiBold, dim | 설정 묶음 제목·날짜 머리 |
| body | 14.5 / 22 | Regular | 본문·설명 문단 |
| toggleLabel | 15 / 20 | Regular | 스위치 줄 라벨 |
| label | 13.5 / 18 | Regular(켜짐 SemiBold) | 칩·버튼 글자 |
| meta | 12.5 / 18 | Regular, dim | 위치·보조 줄 |
| caption | 12 / 16 | Regular, dim | 스위치 설명·시각 |
| tag | 11 / 14 | SemiBold | 태그·상태 알약 |
| mono | 12 / 17 | Monospace | 주소·포트·토큰 일부 |
| input | **16** | Regular | 모든 입력칸 |

- 굵기는 Regular · Medium · SemiBold · Bold 네 개까지. 앱 크기가 걱정되면 Regular + SemiBold 두 개로 줄이고 Bold를 SemiBold로 그립니다. 한 앱 안에서는 한 방식으로만.
- 제목은 1~2줄 + 말줄임. 설명 문단은 자르지 않고 스크롤로 해결합니다.
- 시각·바이트·지연 같은 숫자에는 `fontFeatureSettings = "tnum"` 을 줘서 자릿수가 흔들리지 않게 합니다.

## 3. 간격·모서리·테두리

| 항목 | 값(dp) |
|---|---|
| 화면 좌우 거터 | 16 |
| 머리줄 높이 | 56 (왼쪽 16, 오른쪽 6 — 끝에 44dp 아이콘 버튼이 붙으므로) |
| 카드 안쪽 | 16 (조밀한 목록 카드는 12~14) |
| 카드 사이 | 8 |
| 섹션 머리 위 / 아래 | 18 / 6 |
| 칩 사이 | 6~8 |
| 목록 끝 여백 | 24~40 (마지막 카드가 내비바·스낵바에 안 가리게) |

| 모서리 이름 | 값(dp) | 쓰는 곳 |
|---|---|---|
| tag | 5 | 태그·상태 알약 |
| small | 10 | 아이콘 버튼·입력칸·세그먼트·오류 상자 |
| card | 14 | 카드·입력줄·스낵바 |
| panel | 20 | 대화상자 |
| sheet | 24 | 아래 시트 윗모서리 |
| pill | 높이 / 2 | 칩·알약 버튼·스위치 |

- 테두리는 늘 1dp. 선택된 카드는 accent α.6 테두리, 선택된 목록 줄은 accentTint 면 + 왼쪽 3dp accent 띠.
- 상태 물듦 농도: 진행 α.13 · 대기(호박) α.16 · 오류 α.10~.12. 물든 카드에는 같은 색 α.35~.45 테두리.
- 그림자는 쓰지 않습니다. 떠 있는 것은 `raised` 면 + border로 구분합니다.

## 4. 컴포넌트 문법

### 머리줄

```
[표식 22dp] [앱 이름 20 Bold]  [상태 점 + 한 줄 12.5 dim]  ─────  [보조 아이콘 44] [테마 버튼]
─────────────────────────────── 1dp border ───────────────────────────────
```

- 표식은 앱 아이콘의 기호만 22dp 벡터로. 런처 아이콘 PNG를 줄여 쓰지 않습니다.
- 연결 상태는 머리줄에 점 + 짧은 글로(「● 맥 연결됨」).
- 빌드 시각은 머리줄에 두지 않고 설정·정보 화면 맨 아래 caption으로. 머리줄에 있으면 디버그 화면처럼 보입니다.

### 테마 버튼

아이콘은 **지금 보이는 테마**(해/달)를 보여 주고, 시스템 모드면 「자동」 글자를 덧붙입니다. 누를 때마다 시스템 → 밝게 → 어둡게로 돌고, 선택은 SharedPreferences에 저장합니다. 첫 프레임 깜빡임을 줄이려면 저장된 값을 composition 전에 읽습니다.

### 상태 카드(앱의 주인공 카드)

| 상태 | 면 | 테두리 | 왼쪽 | 오른쪽 |
|---|---|---|---|---|
| 준비·유휴 | panel | border | ok 점 | 주 동작 아이콘 버튼 |
| 동작 중 | accentTint | 없음 | 숨쉬는 점 | 끄기/정지 |
| 확인·대기 | warn α.16 | warn α.45 | warn 점 | — |
| 꺼짐·권한 없음 | warn α.15 | warn α.40 | 경고 아이콘 | 「설정 열기」 주 버튼 |
| 오류 | danger α.10 | danger α.35 | — | 「다시 시도」 |

### 알약·칩·태그

| 종류 | 모양 |
|---|---|
| 상태 알약 | 11sp SemiBold, 면 = 의미색 α.12~.16, 글자 = 의미색, 모서리 5 |
| 필터/선택 칩 | 높이 44, 꺼짐 = panel + border, 켜짐 = accentTint + accent 테두리 + accent 글자 |
| 단일 선택 칩(강한 선택) | 켜짐 = accent 채움 + onAccent 글자 + 체크 아이콘 |
| 모노 태그 | 11sp Monospace, 면 bg, border, 모서리 5 |

### 스위치 — Material3 `Switch` 를 쓰지 않는다

`MaterialTheme` 을 깔지 않은 앱에서 M3 스위치는 기본 보라색으로 나옵니다. 줄 전체가 눌리는 토글 줄을 직접 그립니다.

```kotlin
@Composable
fun ToggleRow(label: String, sub: String = "", on: Boolean, enabled: Boolean = true, onChange: (Boolean) -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 56.dp)
            .toggleable(on, enabled = enabled, role = Role.Switch, onValueChange = onChange)  // TalkBack: 「스위치, 켜짐」
            .padding(vertical = 8.dp).alpha(if (enabled) 1f else .45f),
        verticalAlignment = Alignment.CenterVertically) {
        Column(Modifier.weight(1f).padding(end = 12.dp)) {
            Text(label, color = P.text, fontSize = 15.sp)
            if (sub.isNotEmpty()) Text(sub, color = P.dim, fontSize = 12.sp, lineHeight = 16.sp)
        }
        Box(Modifier.size(48.dp, 28.dp).background(if (on) P.accent else P.panel2, RoundedCornerShape(14.dp))
                .border(1.dp, if (on) P.accent else P.border, RoundedCornerShape(14.dp)).padding(3.dp),
            contentAlignment = if (on) Alignment.CenterEnd else Alignment.CenterStart) {
            Box(Modifier.size(22.dp).background(if (on) P.onAccent else P.dim, CircleShape))
        }
    }
}
```

스위치가 네트워크 요청을 부르는 경우(foldmic: 켜면 맥에 요청)에는 누르는 즉시 트랙을 바꾸지 말고 「바꾸는 중」을 보인 뒤 서버 응답으로 확정합니다. 실패하면 되돌리고 카드에 오류 한 줄을 띄웁니다.

### 버튼

| 종류 | 모양 |
|---|---|
| 주 버튼 | 높이 ≥ 48, 모서리 24, 면 accent, 글자 onAccent 14 SemiBold |
| 보조 버튼 | 같은 크기, 면 투명, border 테두리, 글자 text |
| 위험 버튼 | **채우지 않는** danger 글자 버튼, 기본 포커스 없음, 지울 개수를 글에 적음 |
| 아이콘 버튼 | 44~48 정사각 터치, 아이콘 20~22, `onClickLabel` 필수 |
| 원형 동작 버튼 | 48~72 원, 마이크·보내기·정지 |

한 화면에 accent로 채운 버튼은 하나만 둡니다.

### 빈 화면·오류·로딩

| 상태 | 문법 |
|---|---|
| 빈 화면 | 가운데 아이콘 + dim 문장 한 줄: 무엇이 없고 **어떻게 채우는지** |
| 첫 로딩 | 「…받는 중…」 한 줄 + 스피너 |
| 갱신 중 | 이미 있는 내용은 **지우지 않고** 유지 + 머리줄에 「받는 중…」 |
| 오류 | danger 물듦 상자에 ① 마지막 성공 시각 ② 원인 추정 ③ 원문 에러, 그리고 「다시 시도」 |
| 스낵바 | 아래 가운데, raised 면 + border, 최소 높이 48, 키보드 위로 |

오류 문장은 「연결 안 됨」에서 끝내지 않고 다음 행동을 붙입니다. 예: 「맥에 닿지 않습니다 · 마지막 성공 3분 전 · 노트북이 덮였거나 Tailscale이 꺼졌을 수 있어요」.

## 5. 스크롤·인셋

- `enableEdgeToEdge()` 뒤에 뿌리 Box에 **`background(bg)` 먼저, 그다음 `safeDrawingPadding()`**. 상태바·내비바 뒤는 bg색으로 칠해지고, 펀치홀과 키보드까지 한 번에 피합니다.
- 상태바 아이콘 색을 테마에 맞춰 뒤집습니다(`isAppearanceLightStatusBars = !dark`). 빠뜨리면 라이트 테마에서 상태바 글자가 흰색이라 안 보입니다.
- 매니페스트에 `android:windowSoftInputMode="adjustResize"`.
- **화면당 세로 스크롤 하나.** `LazyColumn` 안에 `verticalScroll` 을 넣지 않습니다. 칩 줄은 가로 스크롤.
- 긴 글(주소·에러 원문)은 길게 눌러 복사할 수 있게 `SelectionContainer` 로 감쌉니다.
- 새 항목이 위에 붙는 목록은 사람이 맨 위를 보고 있을 때만 따라 올라갑니다.
- 폴링은 화면이 보일 때만 돌립니다.

## 6. 폴드8 자세 대응

실측 창 크기(시스템 바 포함): **커버 475 × 751dp · 펼침 933 × 704dp**(돌리면 704 × 933). 기준선은 600dp입니다.

| 자세 | 배치 |
|---|---|
| 커버 세로 | 한 줄 흐름: 머리줄 → 상태 카드 → 섹션들 |
| 커버 가로(높이 < 480) | 머리줄을 한 줄로 줄이고(상태 글 숨기고 점만) 여백을 줄임 |
| 펼침 · 돌림 | 목록형 앱은 목록 \| 상세 2칸(또는 3칸). 설정형 앱은 2열 그리드이거나, 1열이면 최대 폭 560dp로 가운데 — 글 줄이 900dp로 늘어나지 않게 |
| 반접힘(테이블톱) | 위 = 읽기·상태, 아래 = 조작판. 힌지 위 24dp 띠에는 글자를 두지 않음 |

배운 것:

- **자세 판정은 `LocalConfiguration` 의 화면 dp로** 합니다. 인셋을 뺀 크기로 판정하면 키보드가 뜰 때 높이가 줄어 자세가 뒤집힙니다.
- **폴드8은 반접힘에서도 FoldingFeature를 FLAT으로만 줍니다.** 힌지 각도 센서(`TYPE_HINGE_ANGLE`)가 30~150°에 0.5초 머물면 반접힘으로 인정하는 방식으로 판정했습니다.
- 매니페스트에 `configChanges="orientation|screenSize|screenLayout|smallestScreenSize|keyboardHidden|density|uiMode"` + `android.supports_size_changes` + `resizeableActivity="true"` 를 주면 접고 펴도 액티비티가 다시 만들어지지 않아 스크롤과 입력이 남습니다. `uiMode` 가 들어 있으니 시스템 다크 전환도 재생성 없이 받습니다.

## 7. 아이콘

- **문법**: 거의 검은 타일(`#0B0E12`) + 대표색 radial 글로우 + 대표색 linear 그라데이션 기호 하나.
- **격자**: 108dp 적응형 아이콘, 기호는 보이는 72dp의 약 55%.
- **레이어 3개**: 전경 · 배경 · **단색(monochrome)**. One UI 테마 아이콘을 켜도 형태가 유지됩니다.
- **만든 방법**: 이미지 생성 모델로 앱마다 시안 3개를 뽑아 사람이 고르고, 고른 그림을 파이썬 생성기 하나가 SVG 미리보기와 안드로이드 VectorDrawable로 다시 그립니다. 생성된 XML은 손으로 고치지 않고 생성기를 고쳐 다시 돌립니다.
- 화면 안 아이콘은 lucide(ISC 라이선스) 경로 중 필요한 것만 코드에 두고, material-icons 의존은 넣지 않습니다.

| 앱 | 기호 | 대표색 |
|---|---|---|
| ClipBridge | 폴더블 ↔ 노트북을 잇는 아치 | 민트 → 틸 |
| 사이버덱 | 화면 + 트랙볼 덱 | 라임 |
| foldmic | 마이크 → 노트북 케이블 | 라일락 → 바이올렛 |
| 폴드 에이전트 | 반짝임 + 음성 파문 | 피치 → 코랄 |
| Claude 기록 | 되돌리기 화살표 + 말풍선 | 로즈 |
| 핀백 | 핀 + 북마크 | 블루 |
| cmux 모바일 관제실 | 쉐브론 | 하늘 → 인디고 |

## 8. 빌드 설정(이 랩의 기준값)

| 항목 | 값 |
|---|---|
| Gradle | 9.7.1 |
| Android Gradle Plugin | 9.4.1 (Kotlin 내장 — `kotlin.android` 플러그인을 따로 넣으면 빌드가 죽습니다) |
| Compose 컴파일러 플러그인 | `org.jetbrains.kotlin.plugin.compose` 2.4.20 |
| compileSdk / targetSdk / minSdk | 36 / 36 / 30 |
| Compose BOM | `2026.06.01` (2026.08 이후는 compileSdk 37을 요구) |
| JDK | 21 |

## 9. 따라 하지 말 것(기존 앱에서 발견한 약점)

| 약점 | 대신 |
|---|---|
| 다크에서 밝은 accent 위 흰 글자(대비 3.8~3.9) | onAccent를 테마별로, 다크는 짙은 색 |
| 반전 토스트가 다크에서 안 보임(흰 글자 on 밝은 면 ≈ 1.1:1) | 반전 알약은 면 `text` + 글자 `bg` |
| 칩 32~34dp, 버튼 38dp | 44~48dp. 보이는 크기를 유지하려면 `minimumInteractiveComponentSize()` |
| 아이콘 버튼 이름 누락 | `clickable(onClickLabel = …)`, 장식 아이콘만 null |
| 스위치·체크를 `clickable` 로 만들어 TalkBack이 켜짐/꺼짐을 모름 | `toggleable(role = Role.Switch)` |
| 테마 버튼이 시스템 모드를 드러내지 않음 | 「자동」 글자 |
| 유니코드 글리프를 아이콘으로 | 벡터 아이콘. 글리프는 폰트마다 굵기·기준선이 달라 정렬이 흔들립니다 |
| 빌드 시각이 머리줄에 상시 노출 | 설정 화면 맨 아래 caption |
| 팔레트 밖 하드코딩 색 | 역할 토큰만 |
| 회색 자리표시 글자 대비 3.3 | 자리표시도 `dim`(≥ 4.5) |
| 토스트가 키보드·내비바를 모름 | `navigationBarsPadding().imePadding()` |
| 첫 화면에 긴 안내문 세 문단 | 첫 화면은 **상태 + 한 동작**. 원리 설명은 접이식 「어떻게 동작하나요?」 |

그대로 가져온 좋은 점: 오류 상자에 마지막 성공·원인 추정·원문을 같이 보이는 것, 갱신이 실패해도 직전 내용을 남기는 것, 되돌릴 수 없는 동작은 채우지 않은 위험 버튼 + 개수 명시, 스와이프 삭제 + 5초 실행 취소, 목록 키를 표시 글자가 아니라 안정 키로 두는 것(같은 날짜 글자가 키로 겹쳐 앱이 죽은 적이 있습니다).
