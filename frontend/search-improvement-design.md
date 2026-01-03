# 검색 로직 개선 설계도: 전체 서버 검색 (Global Search)

## 1. 개요 (Overview)
현재 메인 페이지 검색창에서 **서버를 선택하지 않고** 검색(Enter 키 또는 돋보기 클릭)을 시도할 때, 자동완성 결과가 로딩되지 않은 상태라면 "검색 결과가 없습니다"라는 에러가 발생합니다.
이를 개선하여, 서버 미선택 시 **전체 서버를 대상**으로 검색을 수행하고, 결과에 따라 적절한 동작(이동 또는 목록 표시)을 수행하도록 합니다.

## 2. 현상 분석 (Current Status)
- **파일**: `frontend/src/app/components/SearchBar.tsx`
- **현재 로직**:
  1. `handleSearch` 함수 호출.
  2. `server` 값이 있으면 해당 서버 페이지로 즉시 이동.
  3. `server` 값이 없으면 `results` (자동완성 목록) 확인.
     - 목록이 있으면 첫 번째 항목 또는 일치하는 항목으로 이동.
     - **문제점**: 목록이 아직 로딩되지 않았거나 비어있으면 `setError` 호출 후 중단.

## 3. 개선 방향 (Proposed Changes)

### 3.1 `SearchBar.tsx` 로직 변경
`handleSearch` 함수 내에서 `server`가 선택되지 않았고 `results`가 없을 경우의 처리를 추가합니다.

#### 변경된 흐름:
1. 사용자가 검색어 입력 후 Enter 입력.
2. `server` 값 확인:
   - **있음**: 기존대로 이동.
   - **없음 (전체 서버)**:
     - `results` 확인.
       - **있음**: 기존대로 이동.
       - **없음**: **즉시 검색 API 호출 (Global Search)** 수행.

### 3.2 Global Search 실행 및 결과 처리
- **API 호출**: `performHybridSearch` 또는 `supabaseApi.searchCharacter`를 `serverId` 없이 호출.
- **결과 처리**:
  - **결과 0개**: "검색 결과가 없습니다." 에러 표시.
  - **결과 1개**: 해당 캐릭터의 서버와 종족 정보를 바탕으로 **즉시 페이지 이동**.
  - **결과 2개 이상**: 
    - 검색 결과를 `results` 상태에 업데이트.
    - 드롭다운(자동완성 목록)을 강제로 열어 사용자에게 선택 유도.
    - 안내 메시지 표시 (예: "여러 서버에서 캐릭터가 발견되었습니다. 선택해주세요.").

## 4. 상세 구현 계획 (Implementation Details)

### `handleSearch` 수정
```typescript
const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    // 1. 서버가 선택된 경우 -> 즉시 이동
    if (server) {
        // ... (기존 로직)
        return
    }

    // 2. 서버 미선택 && 자동완성 결과가 이미 있는 경우 -> 결과 활용 이동
    if (results.length > 0) {
        // ... (기존 로직)
        return
    }

    // 3. 서버 미선택 && 결과 없음 -> 직접 검색 시도 (신규 로직)
    setLoading(true)
    setError('')
    
    try {
        // 전체 서버 대상 검색 호출
        const searchResults = await supabaseApi.searchCharacter(name, undefined, race, 1)
        
        if (searchResults.length === 0) {
            setError('검색 결과가 없습니다.')
        } else if (searchResults.length === 1) {
            // 단일 결과 -> 즉시 이동
            const char = searchResults[0]
            // ... navigate to char
        } else {
            // 복수 결과 -> 목록 표시
            setResults(searchResults)
            setShowResults(true) // 드롭다운 열기
            setIsDropdownOpen(false) // 서버 선택창은 닫기
            // 사용자에게 알림 (선택적)
        }
    } catch (e) {
        setError('검색 중 오류가 발생했습니다.')
    } finally {
        setLoading(false)
    }
}
```

## 5. 기대 효과 (Expected Outcome)
- 사용자가 서버를 모르거나 선택하지 않아도 캐릭터 이름만으로 검색 가능.
- 빠른 입력(자동완성 로딩 전 엔터) 시에도 에러 없이 검색 수행.
- 사용자 경험(UX) 향상.