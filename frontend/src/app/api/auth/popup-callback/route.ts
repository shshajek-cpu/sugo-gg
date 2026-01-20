import { NextRequest, NextResponse } from 'next/server'

// 팝업 전용 콜백 - 순수 HTML만 반환 (사이트 레이아웃 없음)
export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>로그인 처리 중...</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #0B0D12;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container {
      text-align: center;
      color: white;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #333;
      border-top-color: #f59e0b;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>로그인 처리 중...</p>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script>
    (async function() {
      try {
        const SUPABASE_URL = '${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mnbngmdjiszyowfvnzhk.supabase.co'}';
        const SUPABASE_ANON_KEY = '${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uYm5nbWRqaXN6eW93ZnZuemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYzMTkzMDMsImV4cCI6MjA1MTg5NTMwM30.gclk4JVVvF1MmKOr8jCvHqKaQNGX3GrW5fFbL5rhSw8'}';

        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // URL에서 인증 토큰 처리
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth error:', error);
        }

        if (session) {
          console.log('Login successful, closing popup...');

          // device_id 마이그레이션 (있으면)
          const deviceId = localStorage.getItem('ledger_device_id');
          if (deviceId) {
            fetch('/api/auth/migrate-device', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + session.access_token
              },
              body: JSON.stringify({ device_id: deviceId })
            }).then(() => {
              localStorage.removeItem('ledger_device_id');
            }).catch(console.error);
          }
        }

        // 창 닫기
        window.close();

        // window.close()가 작동하지 않는 경우 (일부 브라우저)
        setTimeout(function() {
          document.body.innerHTML = '<div class="container"><p>로그인 완료! 이 창을 닫아주세요.</p></div>';
        }, 500);

      } catch (err) {
        console.error('Callback error:', err);
        document.body.innerHTML = '<div class="container"><p>오류가 발생했습니다. 창을 닫아주세요.</p></div>';
      }
    })();
  </script>
</body>
</html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
