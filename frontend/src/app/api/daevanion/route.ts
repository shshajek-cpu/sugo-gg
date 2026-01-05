import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams
    const characterId = searchParams.get('characterId')
    const serverId = searchParams.get('serverId')
    const boardId = searchParams.get('boardId')

    // 🔍 DEBUG: Log incoming parameters
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 [DAEVANION API] Incoming Request')
    console.log('characterId:', characterId, '(type:', typeof characterId, ')')
    console.log('serverId:', serverId, '(type:', typeof serverId, ')')
    console.log('boardId:', boardId, '(type:', typeof boardId, ')')

    // 🔬 VALIDATION: Check if boardId is in valid range
    const boardIdNum = parseInt(boardId || '0', 10)
    if (boardIdNum < 11 || boardIdNum > 86) {
        console.warn('⚠️ [DAEVANION API] boardId out of expected range!')
        console.warn('Expected: 11-86 (Elyos) or 51-86 (Asmodian)')
        console.warn('Received:', boardIdNum)
    }

    if (!characterId || !serverId || !boardId) {
        console.error('❌ [DAEVANION API] Missing parameters!')
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    try {
        const url = `https://aion2.plaync.com/api/character/daevanion/detail?lang=ko&characterId=${encodeURIComponent(characterId)}&serverId=${serverId}&boardId=${boardId}`

        // 🔍 DEBUG: Log constructed URL
        console.log('🌐 [DAEVANION API] Calling official API:')
        console.log('URL:', url)

        const res = await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        })

        // 🔍 DEBUG: Log response status
        console.log('📡 [DAEVANION API] Response Status:', res.status, res.statusText)

        if (!res.ok) {
            const errorText = await res.text()
            console.error('❌ [DAEVANION API] Request failed!')
            console.error('Status:', res.status)
            console.error('Response:', errorText)
            return NextResponse.json({
                error: 'API request failed',
                status: res.status,
                details: errorText
            }, { status: res.status })
        }

        const data = await res.json()

        // 🔍 DEBUG: Log successful response
        console.log('✅ [DAEVANION API] Success!')
        console.log('Response keys:', Object.keys(data))
        console.log('nodeList length:', data.nodeList?.length || 0)
        console.log('openStatEffectList length:', data.openStatEffectList?.length || 0)
        console.log('openSkillEffectList length:', data.openSkillEffectList?.length || 0)

        // 🔬 VALIDATION: Log active nodes sample
        const activeNodes = data.nodeList?.filter((n: any) => n.open === 1) || []
        console.log('Active nodes count:', activeNodes.length)
        if (activeNodes.length > 0) {
            console.log('Sample active node:', {
                nodeId: activeNodes[0].nodeId,
                name: activeNodes[0].name,
                grade: activeNodes[0].grade,
                effectCount: activeNodes[0].effectList?.length || 0
            })
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

        return NextResponse.json(data)
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.error('💥 [DAEVANION API] Exception occurred:')
        console.error('Error:', error)
        console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        return NextResponse.json({
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
