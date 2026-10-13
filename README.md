# 2027학년도 1학기 공동교육과정 과목 수요조사

- GitHub Pages: 학생용 과목 검색 및 최대 3과목 선택
- Google Apps Script + 비공개 Google Sheets: 1회용 코드 검증, 응답 저장, 자동 집계, 엑셀 내보내기
- 과목 데이터: 첨부한 2022 개정 교육과정 818개 과목

## 개설 상태
현재 연결 전 미리보기이며 학생 제출 버튼은 비활성화되어 있습니다. Apps Script 웹앱을 먼저 배포한 뒤 `config.js`의 `GAS_WEB_APP_URL`에 `/exec` 주소를 넣고, `ADMIN_SHEET_URL`에 담당자만 접근할 수 있는 시트 주소를 설정하세요.

## Google Sheets 서버 설정
1. 학교 계정으로 Google Sheets를 하나 생성하고 '확장 프로그램 → Apps Script'를 엽니다.
2. 다운로드 패키지의 `apps-script/Code.gs`, `apps-script/CourseData.gs`를 복사해 등록합니다.
3. `initSurvey` 실행 → 시트 새로고침 → '수요조사 관리' 메뉴에서 1회용 코드 발급.
4. 웹앱: 실행 사용자 '나', 액세스 '모든 사용자' → 배포하고 `/exec` URL을 복사합니다.
5. 최종 테스트 후 설문 링크를 배부하세요. 응답은 학교 담당자의 비공개 시트에서만 볼 수 있습니다.

## GitHub Pages 게시
이 브랜치를 사이트로 쓰려면 저장소 Settings → Pages → Deploy from a branch → gh-pages / (root) → Save를 선택하세요. 기존 main은 그대로 유지됩니다.

## 보안
학생 이름, 학번, 이메일은 입력받지 않습니다. 참여코드는 서버 검증하며 관리용 시트는 공개 공유하지 않습니다. 서버가 연결되지 않으면 학생 제출은 동작하지 않습니다.
