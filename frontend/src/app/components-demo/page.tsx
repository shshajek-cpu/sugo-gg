'use client'

import React, { useState } from 'react'
import styles from './page.module.css'

export default function ComponentsDemoPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(65)
  const [toggles, setToggles] = useState({ sound: true, notify: false, dark: true })
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedServer, setSelectedServer] = useState('아르테라')
  const [modalOpen, setModalOpen] = useState(false)
  const [sliderValue, setSliderValue] = useState(50)

  const handleLoadingDemo = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  const servers = ['아르테라', '테메나스', '아즈피아', '에레슈']
  const rankingData = [
    { rank: 1, name: '검은달빛', server: '아르테라', cp: '1,523,400', class: '검투' },
    { rank: 2, name: '하늘바람', server: '테메나스', cp: '1,498,200', class: '궁성' },
    { rank: 3, name: '불꽃전사', server: '아르테라', cp: '1,487,900', class: '수호' },
    { rank: 4, name: '별빛소녀', server: '아즈피아', cp: '1,465,100', class: '마도' },
  ]

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.title}>Component Library</h1>
          <p className={styles.subtitle}>UI 컴포넌트 모음</p>
        </header>

        {/* 버튼 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Buttons</h2>
          <div className={styles.row}>
            <button className={styles.btnPrimary}>저장하기</button>
            <button className={styles.btnSecondary}>취소</button>
            <button className={styles.btnOutline}>더보기</button>
            <button className={styles.btnText}>링크 스타일</button>
          </div>
          <div className={styles.row}>
            <button className={styles.btnSm}>Small</button>
            <button className={styles.btnPrimary}>Medium</button>
            <button className={styles.btnLg}>Large</button>
          </div>
          <div className={styles.row}>
            <button
              className={`${styles.btnPrimary} ${isLoading ? styles.loading : ''}`}
              onClick={handleLoadingDemo}
              disabled={isLoading}
            >
              {isLoading && <span className={styles.spinner}></span>}
              {isLoading ? '처리중...' : '로딩 버튼'}
            </button>
            <button className={styles.btnIcon} title="설정">⚙️</button>
            <button className={styles.btnIcon} title="검색">🔍</button>
            <button className={styles.btnIcon} title="알림">🔔</button>
          </div>
        </section>

        {/* 입력 필드 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Form Elements</h2>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label>캐릭터명</label>
              <input
                type="text"
                placeholder="닉네임 입력"
                className={styles.input}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>서버 선택</label>
              <div className={styles.dropdown}>
                <button
                  className={styles.dropdownTrigger}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {selectedServer}
                  <span className={styles.dropdownArrow}>▼</span>
                </button>
                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {servers.map(server => (
                      <button
                        key={server}
                        className={styles.dropdownItem}
                        onClick={() => {
                          setSelectedServer(server)
                          setDropdownOpen(false)
                        }}
                      >
                        {server}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>검색</label>
              <div className={styles.inputWithIcon}>
                <input type="text" placeholder="검색어 입력..." className={styles.input} />
                <span className={styles.inputIcon}>🔍</span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>범위 조절</label>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{sliderValue}</span>
              </div>
            </div>
          </div>
        </section>

        {/* 토글 & 체크박스 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Toggles & Checkboxes</h2>
          <div className={styles.toggleList}>
            <div className={styles.toggleItem}>
              <span>효과음</span>
              <button
                className={`${styles.toggle} ${toggles.sound ? styles.toggleOn : ''}`}
                onClick={() => setToggles(p => ({ ...p, sound: !p.sound }))}
              >
                <span className={styles.toggleKnob}></span>
              </button>
            </div>
            <div className={styles.toggleItem}>
              <span>푸시 알림</span>
              <button
                className={`${styles.toggle} ${toggles.notify ? styles.toggleOn : ''}`}
                onClick={() => setToggles(p => ({ ...p, notify: !p.notify }))}
              >
                <span className={styles.toggleKnob}></span>
              </button>
            </div>
            <div className={styles.toggleItem}>
              <span>다크 모드</span>
              <button
                className={`${styles.toggle} ${toggles.dark ? styles.toggleOn : ''}`}
                onClick={() => setToggles(p => ({ ...p, dark: !p.dark }))}
              >
                <span className={styles.toggleKnob}></span>
              </button>
            </div>
          </div>
        </section>

        {/* 카드 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Cards</h2>
          <div className={styles.cardGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>전투력</span>
              <span className={styles.statValue}>1,250,400</span>
              <span className={styles.statChange}>+2.4%</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>공격력</span>
              <span className={styles.statValue}>12,840</span>
              <span className={styles.statChange}>+180</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>방어력</span>
              <span className={styles.statValue}>8,420</span>
              <span className={styles.statNeutral}>-</span>
            </div>
          </div>

          <div className={styles.characterCard}>
            <div className={styles.characterAvatar}>⚔️</div>
            <div className={styles.characterInfo}>
              <h3>검은달빛</h3>
              <p>검투성 · 아르테라</p>
            </div>
            <span className={styles.characterCp}>1,523,400</span>
          </div>
        </section>

        {/* 탭 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tabs</h2>
          <div className={styles.tabsWrapper}>
            <div className={styles.tabs}>
              {['전체', '무기/방어구', '악세서리', '소모품'].map((tab, idx) => (
                <button
                  key={idx}
                  className={`${styles.tab} ${activeTab === idx ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(idx)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className={styles.tabPanel}>
              {activeTab === 0 && <p>전체 아이템 목록</p>}
              {activeTab === 1 && <p>무기/방어구 목록</p>}
              {activeTab === 2 && <p>악세서리 목록</p>}
              {activeTab === 3 && <p>소모품 목록</p>}
            </div>
          </div>
        </section>

        {/* 배지 & 태그 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Badges & Tags</h2>
          <div className={styles.row}>
            <span className={styles.badge}>기본</span>
            <span className={`${styles.badge} ${styles.badgePrimary}`}>신규</span>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>완료</span>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>진행중</span>
            <span className={`${styles.badge} ${styles.badgeDanger}`}>마감</span>
          </div>
          <div className={styles.row}>
            <span className={styles.tag}>검투성</span>
            <span className={styles.tag}>궁성</span>
            <span className={styles.tag}>수호성</span>
            <span className={styles.tag}>마도성</span>
          </div>
        </section>

        {/* 프로그레스 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Progress</h2>
          <div className={styles.progressSection}>
            <div className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <span>일일 퀘스트</span>
                <span>3 / 5</span>
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <span>주간 레이드</span>
                <span>2 / 3</span>
              </div>
              <div className={styles.progressBar}>
                <div className={`${styles.progressFill} ${styles.progressWarning}`} style={{ width: '66%' }}></div>
              </div>
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressInfo}>
                <span>시즌 패스</span>
                <span>45 / 100</span>
              </div>
              <div className={styles.progressBar}>
                <div className={`${styles.progressFill} ${styles.progressSuccess}`} style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* 테이블 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Table</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>순위</th>
                  <th>캐릭터</th>
                  <th>서버</th>
                  <th>직업</th>
                  <th>전투력</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map(row => (
                  <tr key={row.rank}>
                    <td className={styles.rankCell}>
                      <span className={row.rank <= 3 ? styles.topRank : ''}>{row.rank}</span>
                    </td>
                    <td>{row.name}</td>
                    <td>{row.server}</td>
                    <td>{row.class}</td>
                    <td className={styles.cpCell}>{row.cp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 알림 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Alerts</h2>
          <div className={styles.alertStack}>
            <div className={styles.alertSuccess}>저장이 완료되었습니다.</div>
            <div className={styles.alertWarning}>변경사항이 저장되지 않았습니다.</div>
            <div className={styles.alertDanger}>오류가 발생했습니다. 다시 시도해주세요.</div>
            <div className={styles.alertInfo}>새로운 업데이트가 있습니다.</div>
          </div>
        </section>

        {/* 모달 트리거 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Modal</h2>
          <button className={styles.btnPrimary} onClick={() => setModalOpen(true)}>
            모달 열기
          </button>
        </section>

        {/* 아바타 & 리스트 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>List Items</h2>
          <div className={styles.list}>
            <div className={styles.listItem}>
              <div className={styles.avatar}>🗡️</div>
              <div className={styles.listContent}>
                <span className={styles.listTitle}>타락한 용의 검</span>
                <span className={styles.listSub}>전설 · 공격력 +2,400</span>
              </div>
              <span className={styles.listMeta}>Lv.80</span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.avatar}>🛡️</div>
              <div className={styles.listContent}>
                <span className={styles.listTitle}>수호자의 판금갑옷</span>
                <span className={styles.listSub}>영웅 · 방어력 +1,800</span>
              </div>
              <span className={styles.listMeta}>Lv.78</span>
            </div>
            <div className={styles.listItem}>
              <div className={styles.avatar}>💍</div>
              <div className={styles.listContent}>
                <span className={styles.listTitle}>고대 정령의 반지</span>
                <span className={styles.listSub}>전설 · 치명타 +5%</span>
              </div>
              <span className={styles.listMeta}>Lv.80</span>
            </div>
          </div>
        </section>

        {/* 스켈레톤 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Skeleton Loading</h2>
          <div className={styles.skeletonCard}>
            <div className={styles.skeletonAvatar}></div>
            <div className={styles.skeletonLines}>
              <div className={styles.skeletonLine}></div>
              <div className={`${styles.skeletonLine} ${styles.short}`}></div>
            </div>
          </div>
        </section>

        {/* 툴팁 */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Tooltips</h2>
          <div className={styles.row}>
            <div className={styles.tooltipWrapper}>
              <button className={styles.btnSecondary}>마우스 올리기</button>
              <span className={styles.tooltip}>추가 정보가 표시됩니다</span>
            </div>
          </div>
        </section>
      </div>

      {/* 모달 */}
      {modalOpen && (
        <div className={styles.modalOverlay} onClick={() => setModalOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>알림</h3>
              <button className={styles.modalClose} onClick={() => setModalOpen(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p>작업을 계속하시겠습니까?</p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setModalOpen(false)}>취소</button>
              <button className={styles.btnPrimary} onClick={() => setModalOpen(false)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
