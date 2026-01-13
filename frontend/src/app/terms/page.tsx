'use client'

export default function TermsPage() {
    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
            <h1 style={{ color: 'var(--primary)', marginBottom: '30px' }}>이용약관</h1>

            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
                본 약관은 HitOn(이하 "서비스")의 이용 조건 및 절차, 이용자와 서비스 간의 권리, 의무 및 책임사항을 규정합니다.
            </p>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제1조 (목적)</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    본 약관은 서비스가 제공하는 AION 2 게임 정보 검색 및 관련 서비스의 이용과 관련하여
                    서비스와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
                </p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제2조 (정의)</h2>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li><strong>"서비스"</strong>란 HitOn이 제공하는 AION 2 캐릭터 검색, 랭킹, 장비 정보 등 모든 관련 서비스를 의미합니다.</li>
                    <li><strong>"이용자"</strong>란 본 약관에 따라 서비스가 제공하는 서비스를 이용하는 자를 의미합니다.</li>
                    <li><strong>"콘텐츠"</strong>란 서비스가 제공하는 캐릭터 정보, 랭킹 데이터, 통계 자료 등을 의미합니다.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제3조 (약관의 효력 및 변경)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.</li>
                    <li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.</li>
                    <li>약관이 변경되는 경우 서비스는 변경사항을 서비스 내 공지합니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제4조 (서비스의 제공)</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스는 다음과 같은 서비스를 제공합니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>AION 2 캐릭터 검색 및 정보 조회</li>
                    <li>서버별, 직업별 랭킹 정보</li>
                    <li>캐릭터 장비 및 스탯 정보</li>
                    <li>캐릭터 비교 기능</li>
                    <li>파티 분석 도구</li>
                    <li>기타 AION 2 관련 정보 서비스</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제5조 (서비스 이용)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스는 연중무휴, 1일 24시간 제공을 원칙으로 합니다.</li>
                    <li>서비스는 시스템 점검, 증설 및 교체, 통신 장애 등의 사유가 발생한 경우 서비스의 전부 또는 일부를 중단할 수 있습니다.</li>
                    <li>서비스 이용은 무료를 원칙으로 합니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제6조 (이용자의 의무)</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    이용자는 다음 행위를 하여서는 안 됩니다:
                </p>
                <ul style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스의 정보를 무단으로 수집, 저장, 공개하는 행위</li>
                    <li>서비스의 운영을 방해하는 행위</li>
                    <li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
                    <li>서비스를 이용하여 법령에 위반되는 행위</li>
                    <li>서비스의 데이터를 상업적 목적으로 무단 사용하는 행위</li>
                    <li>자동화된 수단(봇, 크롤러 등)을 이용한 과도한 접근 행위</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제7조 (지식재산권)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스가 제공하는 콘텐츠에 대한 지식재산권은 서비스에 귀속됩니다.</li>
                    <li>AION 2 게임 관련 상표, 저작권 등은 엔씨소프트(NCSOFT)에 귀속됩니다.</li>
                    <li>이용자는 서비스가 제공하는 콘텐츠를 서비스의 사전 동의 없이 복제, 배포, 방송 등의 방법으로 이용하거나 제3자에게 이용하게 해서는 안 됩니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제8조 (면책조항)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스는 천재지변, 전쟁, 기간통신사업자의 서비스 중지 등 불가항력으로 인해 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.</li>
                    <li>서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해서는 책임을 지지 않습니다.</li>
                    <li>서비스가 제공하는 정보는 AION 2 공식 API를 기반으로 하며, 실제 게임 내 정보와 차이가 있을 수 있습니다.</li>
                    <li>서비스가 제공하는 정보의 정확성, 완전성, 신뢰성에 대해 보증하지 않으며, 이로 인한 손해에 대해 책임을 지지 않습니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제9조 (광고 게재)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스는 서비스 운영과 관련하여 서비스 화면에 광고를 게재할 수 있습니다.</li>
                    <li>서비스는 Google AdSense 등 제3자 광고 서비스를 이용할 수 있습니다.</li>
                    <li>광고에 관한 내용은 해당 광고주의 책임 하에 게재되며, 서비스는 광고 내용에 대해 책임을 지지 않습니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제10조 (분쟁 해결)</h2>
                <ol style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginLeft: '20px' }}>
                    <li>서비스와 이용자 간에 발생한 분쟁에 관한 소송은 대한민국 법을 준거법으로 합니다.</li>
                    <li>서비스와 이용자 간에 발생한 분쟁에 대해서는 서비스 소재지 관할 법원을 전속적 관할 법원으로 합니다.</li>
                </ol>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--text-main)', fontSize: '1.3rem', marginBottom: '15px' }}>제11조 (문의)</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    서비스 이용에 관한 문의는 아래 연락처로 문의해 주시기 바랍니다.
                </p>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.8', marginTop: '10px' }}>
                    이메일: hiton.aion2@gmail.com
                </p>
            </section>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                시행일자: 2025년 1월 13일
            </p>
        </div>
    )
}
