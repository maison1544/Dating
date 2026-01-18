---
auto_execution_mode: 3
description: Remaining parts which the modification is neeeded
---

📌 관리자 / 채팅 / 결제 / 미니게임 시스템 전반 개선 작업 지시서
공통 원칙
기존 비즈니스 로직은 절대 훼손하지 말 것
아래 문제점들을 분석하고 (1)작업 일정을 Sequential Thinking MCP를 사용해서 정리 (2) 수정 작업 진행 (3) Chrome Dev MCP로 수정 사항 전체 테스트를 수행해라

-최상위 규칙-
모든 분석 및 수정작업에 MCP를 동원해서 작업을 수행한다. 기존 맥락에 의존한 일반적 추론을 금지하며, Context7 등의 라이브러리 MCP를 적극적으로 참조해서 수행하며 모든 수정된 사항은 Chrome Dev MCP를 통해 일체의 생략없이 테스트를 수행한다

UI/UX 수정 시 Figma MCP → dating mockups 프로젝트의 기존 목업 레이아웃만 참고

데이터 수정 시 모든 변경 사항은 엔드포인트 연동 여부까지 검증

시간대는 대한민국(KST, UTC+9) 기준으로 통일

0. 미니게임 결과값 팝업 모달이 각 게임마다 해당 컨테이너 내에서 표시되도록 수정해라 또한 화면이 어두워지는 효과를 삭제해라

파워볼

<div class="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-lg p-8 border border-blue-500/30"><h3 class="text-white text-center mb-4">일반볼 (0~130)</h3><div class="flex items-center justify-center gap-4 mb-6"><div class="text-center"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg "><span class="text-white text-2xl">4</span></div></div><div class="text-center"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg "><span class="text-white text-2xl">5</span></div></div><div class="text-center"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg "><span class="text-white text-2xl">9</span></div></div><div class="text-center"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg "><span class="text-white text-2xl">15</span></div></div><div class="text-center"><div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg "><span class="text-white text-2xl">21</span></div></div></div><div class="text-center mb-6"><span class="text-gray-400">합계: </span><span class="text-white text-2xl">54</span></div><h3 class="text-white text-center mb-4">파워볼 (0~9)</h3><div class="flex items-center justify-center"><div class="w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl "><span class="text-white text-3xl">7</span></div></div></div> 
사다리
<div class="bg-gradient-to-br from-purple-900/40 to-pink-900/40 rounded-lg p-8 border border-purple-500/30"><h3 class="text-white text-center mb-6 text-xl">🎲 사다리 게임</h3><div class="relative w-full max-w-lg mx-auto"><div class="flex justify-around mb-6"><div class="flex flex-col items-center"><div class="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"><span class="text-lg">좌</span></div><div class="w-1 h-12 bg-gray-600 mt-2"></div></div><div class="flex flex-col items-center"><div class="w-16 h-16 rounded-full flex items-center justify-center bg-gray-700 text-gray-400"><span class="text-lg">우</span></div><div class="w-1 h-12 bg-gray-600 mt-2"></div></div></div><div class="bg-gray-800/50 rounded-lg p-8 mb-6"><div class="flex justify-center items-center gap-2 text-white text-sm mb-4"><span class="text-gray-400">중간 줄수:</span><span class="px-4 py-1 rounded text-lg bg-purple-500">3줄</span></div><div class="relative h-40"><div class="absolute left-1/4 top-0 bottom-0 w-1 bg-gray-600"></div><div class="absolute right-1/4 top-0 bottom-0 w-1 bg-gray-600"></div><div class="absolute left-1/4 right-1/4 h-1 bg-pink-500" style="top: 25%;"></div><div class="absolute left-1/4 right-1/4 h-1 bg-pink-500" style="top: 50%;"></div><div class="absolute left-1/4 right-1/4 h-1 bg-pink-500" style="top: 75%;"></div></div></div><div class="flex justify-around"><div class="flex flex-col items-center"><div class="w-1 h-12 bg-gray-600 mb-2"></div><div class="w-16 h-16 rounded-full flex items-center justify-center bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50"><span class="text-lg">홀</span></div></div><div class="flex flex-col items-center"><div class="w-1 h-12 bg-gray-600 mb-2"></div><div class="w-16 h-16 rounded-full flex items-center justify-center bg-gray-700 text-gray-400"><span class="text-lg">짝</span></div></div></div><div class="mt-8 text-center"><p class="text-gray-400 text-sm mb-3">최종 결과</p><div class="flex gap-2 justify-center flex-wrap"><span class="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30">좌출발</span><span class="px-4 py-2 rounded-lg text-sm bg-purple-500/20 text-purple-400 border border-purple-500/30">3줄</span><span class="px-4 py-2 rounded-lg text-sm bg-red-500/20 text-red-400 border border-red-500/30">홀</span></div></div></div></div>

1. 관리자 / 에이전트 계정 테이블 정리
   1-1. 불필요한 필드 제거
   admins, agents 테이블의 email 필드 삭제

해당 계정은 생성 시 이메일을 요구하지 않음

1-2. last_login 관련 필드 정합성 수정
모든 테이블 전수 검사

last_login_at 이 NULL인 경우:

실제 마지막 로그인 시각을 정확히 기록하도록 수정

last_login_ip 가 NULL인 경우:

실제 로그인 IP 기록하도록 수정

2. charging_cards 테이블 수정
   created_by 가 NULL로 처리됨

카드를 생성한 관리자 계정의 username 이 기록되도록 수정

3. chat_profiles (채팅 프로필) 구조 개선
   3-1. 프로필 이미지 저장 방식 수정
   현재: image URL 문자열만 저장

수정:

이미지 업로드 시 storage uuid 참조 방식으로 변경

실제 파일은 storage에 저장

user_profiles.profile_image 구조와 동일하게 동작하도록 수정

3-2. chat_profiles 필드 + 엔드포인트 연동 검증
아래 필드들이 실제 로직과 정상 연동되는지 확인 및 수정

is_active : 채팅 프로필 활성화 여부

is_online : 관리자 페이지에서 온라인 토글 상태

total_chats : 해당 프로필로 생성된 전체 채팅방 수

active_chats : 현재 활성화된 채팅방 수

total_messages : 활성화된 채팅방 내 전체 메시지 수 (유저 + 에이전트)

chat_request_count : 해당 프로필 카드로 받은 채팅 신청 수

4. 에이전트 ↔ 채팅 프로필 매핑 구조 개선
   4-1. agents 테이블
   각 에이전트가 배정 받은 채팅 프로필 이름 배열을 저장하도록 수정

4-2. chat_profiles 테이블
해당 프로필에 배정된 에이전트 username 기록

해당 프로필을 에이전트에게 배정한 관리자 username 기록

5. chat_rooms (채팅방) 개선
   5-1. 선물 메시지 기록 개선
   선물 전송 시:

last_message 에 선물 이름 포함

예: 🎁 하트 선물을 보냈습니다

5-2. 시간 필드 정리
last_message_at, created_at 의 용도를 분석

사용자 입장에서 혼란을 주는 경우:

불필요한 필드는 삭제

채팅 메시지 전송 시각을 정확히 기록하는 별도 컬럼 생성

채팅 UI에 표시되는 시간과 DB 시간이 완전히 일치하도록 수정

6. 채팅방 이력 관리 테이블 신규 생성
   신규 테이블 생성
   사용자가 신청하여 활성화된 모든 채팅방 기록

포함 필드:

채팅 프로필 카드 이름

배정된 에이전트 UUID

채팅 신청한 User ID

생성 시각

7. deposit_requests 개선
   7-1. reject_reason NULL 허용
   거절 사유 입력은 선택사항

입력된 경우에만 reject_reason 저장

7-2. 관리자 페이지 UX
거절된 요청은 작업 버튼 비활성화

거절 사유를 관리자 페이지에서 확인 가능하도록 수정

8. 입출금 관리 페이지 UX / 성능 개선
   8-1. 디바운싱
   모든 버튼 및 onclick 콜백 함수 디바운싱 적용

8-2. 캘린더 UX 개선
날짜 역순 선택 불가하도록 수정

예: 1/13 → 1/12 ❌

동일한 캘린더 UX 문제 전수 조사 후 모두 동일하게 수정

9. 관리자 페이지 – 채팅 프로필 관리
   “새 프로필 추가” 버튼이 동작하지 않는 버그 수정

10. 기프트 관리 개선
    10-1. 리스트 정렬
    활성화된 선물 → 상단

비활성화된 선물 → 하단

구매 수 기준 내림차순 정렬

10-2. 신규 선물 추가
이모지 입력 필드에 이모지만 입력 가능하도록 제한

11. 미니게임 관리 페이지
    11-1. 배팅 현황 미작동 문제 수정
    11-2. 결과 예약 버튼 UX 수정
    결과 예약 클릭 시:

예약 UI 표시

취소 버튼 노출

Figma MCP → dating mockups

AdminMiniGamesPage.tsx 목업 레이아웃만 참고

기존 로직 절대 변경 금지

11-3. 게임 설정 실제 반영
발매 / 배팅탭 관리

배당 설정

배팅 제한

회차 시간
→ 사용자 설정값이 실제 게임 로직에 반영되도록 수정

11-4. 저장 방식 통일
배팅 제한 / 회차 시간도

배당 설정처럼 저장 확인 버튼 클릭 시에만 저장

12. 공지사항 관리
    작성자: 관리자 username 저장

유저 페이지에서는 작성자 필드 제거

13. 캘린더 조회 성능 개선
    조회 로직 디바운싱

불필요한 리렌더링 제거

대량 데이터에서도 빠르게 동작하도록 최적화

14. 회원 관리 페이지 개선
    14-1. 채팅 내역 표시 오류 수정
    미니게임 채팅이 [object Object] 로 표시되는 문제 해결

Figma MCP → UserDetailModal.tsx 목업 레이아웃 참고

로직 변경 금지, UI만 수정

14-2. 불필요한 모달 제거
아래 항목 삭제:

E2E 프로필

e2e-chatlist-\* 모달

14-3. 상세 정보 전체 수정
회원정보

포인트 내역

기프트 내역

채팅 내역

미니게임 배팅 내역
→ 전부 Figma 목업과 동일하게 수정

15. 시간대 전면 수정
    15-1. game_rounds
    대한민국 시간대(KST) 기준으로 수정

15-2. 전체 테이블 전수 검사
모든 datetime 컬럼이 KST 기준 오프셋을 참조하도록 수정

16. DB 구조 전수 정리 및 최적화
    사용하지 않는 테이블 삭제

누락된 컬럼 보완

인덱스 / 쿼리 최적화

전체 SQL 구조 정리

17. login_logs 테이블
    실제 로그인 로그 기록하도록 구현
    불필요하다 판단 시 테이블 삭제

📌 최종 목표
데이터 정합성 100%

관리자 UX 혼란 요소 제거

시간/로그/채팅 기록 정확성 확보

유지보수 가능한 DB 구조 완성
d 	d�	 �	�	
�	�* �*�*
�*�* �*�*
�*�- �-�-
�-�/ �/�/
�/�/ �/�/
�/�6 �6�6
�6�6 �6�6
�6�8 �8�8
�8�9 �9�9
�9�< �<�<
�<�= �=�=
�=�> �>�>
�>�? �?�?
�?�A �A�A
�A�A �A�A
�A�C �C�C
�C�D �D�D
�D�E �E�E
�E�F �F�G
�G�G �G�G
�G�G �G�G
�G�K �K�L
�L�M �M�M
�M�N �N�N
�N�N �N�N
�N�P �P�P
�P�R �R�R
�R�R �R�R
�R�T �T�T
�T�U �U�U
�U�V �V�V
�V�W �W�W2Pfile:///c:/Users/Windows%20X/Desktop/Dating/.windsurf/workflows/debugworkflow.md