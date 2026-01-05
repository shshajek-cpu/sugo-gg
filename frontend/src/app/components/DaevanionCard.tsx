export default function DaevanionCard({ daevanion, isEmbedded = false }: { daevanion: any, isEmbedded?: boolean }) {
    if (!daevanion) return null

    const boardList = daevanion.boardList || []

    // Korean God Names order (matches typical UI order)
    const godNames = ['네자칸', '지켈', '바이젤', '트리니엘', '아리엘', '아스펠']

    return (
        <div style={isEmbedded ? { width: '100%' } : {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.8rem',
            marginTop: '0.5rem',
            background: '#111318',
            border: '1px solid #1F2433',
            borderRadius: '12px',
            padding: '1.25rem',
            boxSizing: 'border-box'
        }}>
            {/* Header */}
            {!isEmbedded && (
                <div style={{
                    fontSize: '0.9rem',
                    color: '#9CA3AF',
                    fontWeight: 600,
                    marginBottom: '-0.3rem',
                    paddingLeft: '0.2rem'
                }}>
                    데바니온
                </div>
            )}

            {/* Grid Container */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.5rem'
            }}>
                {godNames.map((godName, idx) => {
                    // Use name matching for reliability
                    const board = boardList.find((b: any) => b.name === godName) || {}

                    // Use correct field names from API debug
                    const current = board.openNodeCount || 0
                    const total = board.totalNodeCount || 0

                    // Highlight logic: if current > 0, consider it active
                    const isActive = current > 0

                    // Dynamic text color for name (using distinct colors like in the image if possible, or consistent white)
                    // Image shows: Orange for Ariel, Purple for Asphel, White for others.
                    // Let's implement this subtle detail.
                    let nameColor = '#E5E7EB'
                    if (godName === '아리엘') nameColor = '#FF7B54' // Orange-ish
                    if (godName === '아스펠') nameColor = '#A78BFA' // Purple-ish

                    return (
                        <div key={godName} style={{
                            background: '#111318',
                            border: '1px solid #1F2433',
                            borderRadius: '8px',
                            padding: '0.6rem 1rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                color: nameColor,
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}>
                                {godName}
                            </span>
                            <span style={{
                                color: isActive ? '#F3F4F6' : '#6B7280',
                                fontWeight: 500,
                                fontSize: '0.9rem'
                            }}>
                                {current}{total > 0 ? `/${total}` : ''}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
