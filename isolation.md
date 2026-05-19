현재 프로젝트는 localhost:3000 기반 단일 개발환경에서 우선 로컬 테스트가 가능하도록 유지합니다.

하지만 향후 production 배포 시 아래와 같은 서브도메인 기반 완전 세션 분리 구조로 확장 가능해야 합니다:

* app.example.com → user
* admin.example.com → admin
* agent.example.com → agent

따라서 지금부터 전체 auth/session/router 구조를 subdomain-compatible architecture 기준으로 재설계합니다.

중요 요구사항:

* 현재 localhost 환경에서는:

  * /
  * /admin
  * /agent
    구조 유지

* 하지만 내부 구조는 향후:

  * app.example.com
  * admin.example.com
  * agent.example.com
    로 쉽게 이전 가능해야 함

반드시 다음 구조를 적용합니다:

* user/admin/agent 각각 독립된 auth client
* 각각 다른 storageKey
* 각각 다른 cookie namespace
* 각각 다른 session persistence
* 각각 독립된 auth context/provider
* 각각 독립된 middleware validation

중요:
단순 role 체크가 아니라 실제 auth/session storage 레벨에서 완전 격리합니다.

절대 다음 방식 금지:

* global supabase singleton 공유
* shared auth context
* pathname 하드코딩 기반 auth 처리
* 브라우저 전역 session 공유
* role 기반 UI 숨김만 처리

반드시 app scope abstraction 구조를 도입하여:

* current app scope
* auth scope
* session scope
* storage namespace
  를 분리 관리합니다.

향후 서브도메인 전환 시:

* auth 로직 재작성 없이
* routing/config 변경만으로
* production multi-subdomain 구조가 가능해야 합니다.

또한 다음 항목 검증:

* cross-role session leakage 없음
* multi-tab 정상동작
* hydration/session collision 없음
* logout isolation 정상
* refresh persistence 정상
* middleware redirect 정상
* SSR/CSR session mismatch 없음

최종적으로:

* user 영역 세션은 user 영역에서만 사용
* admin 영역 세션은 admin 영역에서만 사용
* agent 영역 세션은 agent 영역에서만 사용
  하도록 완전히 격리합니다.

향후 production 환경에서는:

* app.example.com
* admin.example.com
* agent.example.com

구조로 운영 예정입니다.

따라서 현재 localhost 기반 개발 구조에서도:

* host 기반 app scope resolution
* subdomain-aware middleware
* isolated cookie strategy
* isolated auth persistence
  를 고려한 구조로 구현합니다.

또한 production migration 시:

* DNS 설정 방식
* Vercel domain 연결 방식
* middleware rewrite 구조
* Supabase redirect URL 설정
* cookie domain 전략
* OAuth callback 전략
  을 /docs/subdomain-migration-plan.md 에 문서화합니다.
