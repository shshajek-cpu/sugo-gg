'use client'

export default function PrivacyPolicyPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ color: 'var(--primary)', marginBottom: '30px' }}>개인정보처리방침</h1>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                HitOn(이하 "서비스")은 이용자의 개인정보를 중요시하며, 개인정보보호법 등 관련 법령을 준수합니다.
                본 개인정보처리방침은 서비스 이용 시 수집되는 개인정보의 처리에 관한 사항을 안내합니다.
            </p>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>1. 수집하는 개인정보 항목</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 다음과 같은 개인정보를 수집할 수 있습니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>게임 캐릭터 정보 (캐릭터명, 서버, 직업, 레벨 등)</li>
                    <li>서비스 이용 기록 (접속 일시, 검색 기록)</li>
                    <li>기기 정보 (브라우저 종류, OS 정보)</li>
                    <li>쿠키 및 로컬 스토리지 데이터</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>2. 개인정보의 수집 및 이용 목적</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    수집한 개인정보는 다음의 목적을 위해 이용됩니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>캐릭터 검색 및 정보 제공 서비스</li>
                    <li>랭킹 및 통계 서비스 제공</li>
                    <li>서비스 개선 및 신규 기능 개발</li>
                    <li>서비스 이용 통계 분석</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>3. 개인정보의 보유 및 이용 기간</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 원칙적으로 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
                    단, 관련 법령에 의해 보존할 필요가 있는 경우 일정 기간 동안 보관됩니다.
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>캐릭터 정보: 마지막 조회일로부터 90일</li>
                    <li>서비스 이용 기록: 3개월</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>4. 개인정보의 제3자 제공</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
                    다만, 다음의 경우에는 예외로 합니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>이용자가 사전에 동의한 경우</li>
                    <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>5. 쿠키(Cookie) 사용</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 이용자에게 더 나은 서비스를 제공하기 위해 쿠키를 사용합니다.
                    쿠키는 웹사이트가 이용자의 컴퓨터 브라우저에 보내는 소량의 정보입니다.
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>쿠키 사용 목적: 이용자 설정 저장, 서비스 이용 분석</li>
                    <li>쿠키 설정 거부 방법: 브라우저 설정에서 쿠키를 허용하지 않도록 설정할 수 있습니다</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>6. 광고 서비스</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 Google AdSense를 통해 광고를 게재합니다.
                    Google은 사용자의 관심사에 기반한 광고를 게재하기 위해 쿠키를 사용할 수 있습니다.
                    사용자는 Google 광고 설정에서 맞춤 광고를 비활성화할 수 있습니다.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginTop: '10px' }}>
                    자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Google 광고 정책</a>을 참조하세요.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>7. 이용자의 권리</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    이용자는 언제든지 자신의 개인정보에 대해 다음의 권리를 행사할 수 있습니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>개인정보 열람 요청</li>
                    <li>개인정보 정정 및 삭제 요청</li>
                    <li>개인정보 처리 정지 요청</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>8. 개인정보 보호책임자</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스의 개인정보 처리에 관한 업무를 총괄하여 책임지고,
                    개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginTop: '10px' }}>
                    문의: hiton.aion2@gmail.com
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>9. 개인정보처리방침의 변경</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    본 개인정보처리방침은 법령, 정책 또는 서비스의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있습니다.
                    변경사항은 서비스 내 공지를 통해 안내됩니다.
                </p>
            </section>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                시행일자: 2025년 1월 13일
            </p>
        </div>
    )
}
