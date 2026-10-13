/**
 * 가평고 2027학년도 1학기 공동교육과정 수요조사
 * Google Sheets에 바인딩한 Apps Script에 붙여넣고 initSurvey() 1회 실행.
 * 웹앱: 실행 계정 = 나 / 액세스 권한 = 모든 사용자(학생 코드로 제출 검증).
 * 개인정보 최소화: 학생 이름/학번/IP/이메일을 저장하지 않습니다.
 */
const TAB = Object.freeze({courses:'과목',codes:'참여코드',responses:'응답',selections:'선택내역',summary:'집계',report:'제출용 보고서',settings:'설정'});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('수요조사 관리')
    .addItem('처음 설치: 시트 초기화', 'initSurvey')
    .addItem('1회용 참여 코드 발급', 'generateCodes')
    .addItem('운영 상태 확인', 'showSurveyStatus')
    .addToUi();
}
function spreadsheet_() { return SpreadsheetApp.getActiveSpreadsheet(); }
function sheet_(key) { const s=spreadsheet_().getSheetByName(TAB[key]); if(!s) throw Error('관리자가 먼저 시트 초기화를 실행해야 합니다.'); return s; }
function ensureSheet_(name, headers, color) {
  const ss = spreadsheet_(); let s = ss.getSheetByName(name);
  if (!s) s=ss.insertSheet(name);
  if (s.getLastRow() === 0 && headers.length) {
    s.getRange(1,1,1,headers.length).setValues([headers]);
    s.getRange(1,1,1,headers.length).setBackground(color || '#102c43').setFontColor('#ffffff').setFontWeight('bold');
    s.setFrozenRows(1);
  }
  return s;
}
function initSurvey() {
  const color='#0b827a';
  const course=ensureSheet_(TAB.courses,['과목 ID','과목명','교과 구분','영역','과목 유형'],color);
  if(course.getLastRow()===1){
    course.getRange(2,1,COURSE_ROWS.length,5).setValues(COURSE_ROWS);
    course.setColumnWidth(2,260);course.setColumnWidth(3,160);course.setColumnWidth(4,185);
  }
  ensureSheet_(TAB.codes,['참여 코드','사용 여부','사용 시각','대상 학년','응답 ID'],color);
  ensureSheet_(TAB.responses,['응답 ID','응답 시각','대상 학년','참여 코드','선택 과목 수'],color);
  ensureSheet_(TAB.selections,['응답 시각','대상 학년','과목명','과목 ID','응답 ID'],color);
  const summary=ensureSheet_(TAB.summary,['대상 학년','과목명','희망 학생수'],color);
  if (summary.getLastRow()===1) {
    summary.getRange('A1:C1').clearContent();
    summary.getRange('A1').setFormula('=QUERY(\''+TAB.selections+'\'!A:E,"select B,C,count(C) where C is not null group by B,C order by B,C label B \'대상 학년\', C \'과목명\', count(C) \'희망 학생수\'",1)');
  }
  const report=ensureSheet_(TAB.report,['연번','지역(교육지원청)','학교명','과목명','대상 학년','희망 학생수','개설 유형','공동교육과정 개설희망 사유'],color);
  if (report.getLastRow()===1) {
    report.getRange('A2').setFormula('=ARRAYFORMULA(IF(\''+TAB.summary+'\'!B2:B="","",{ROW(\''+TAB.summary+'\'!B2:B)-1,IF(\''+TAB.summary+'\'!B2:B<>"","가평",""),IF(\''+TAB.summary+'\'!B2:B<>"","가평고",""),\''+TAB.summary+'\'!B2:B,\''+TAB.summary+'\'!A2:A,\''+TAB.summary+'\'!C2:C,IF(\''+TAB.summary+'\'!B2:B<>"","온라인",""),IF(\''+TAB.summary+'\'!B2:B<>"","","")}))');
    report.setColumnWidths(1,8,150);report.setColumnWidth(4,280);report.setColumnWidth(8,300);
  }
  const settings=ensureSheet_(TAB.settings,['설정명','값','설명'],color);
  if(settings.getLastRow()===1) {
    settings.getRange(2,1,3,3).setValues([
      ['IS_OPEN',true,'FALSE로 변경하면 즉시 응답 마감'],
      ['MAX_CHOICES',3,'학생은 최대 3과목 선택 (학생 화면도 3으로 고정)'],
      ['CLOSE_AT','', '선택: 마감 일시. 빈칸은 마감일 없음']
    ]);
    settings.getRange('B2').insertCheckboxes().setValue(true);
  }
  SpreadsheetApp.flush();
  SpreadsheetApp.getUi().alert('설정 완료: 과목 '+COURSE_ROWS.length+'개를 확인하고 [수요조사 관리 → 1회용 참여 코드 발급]을 실행하세요.\n운영 전 비공개 시트 공유 설정도 확인하세요.');
}
function generateCodes() {
  const ui=SpreadsheetApp.getUi();
  const prompt=ui.prompt('1회용 참여 코드', '추가로 발급할 코드 수(1~500)를 입력하세요.', ui.ButtonSet.OK_CANCEL);
  if(prompt.getSelectedButton()!==ui.Button.OK)return;
  const count=Number(prompt.getResponseText());
  if(!Number.isSafeInteger(count)||count<1||count>500){ui.alert('1~500 사이의 정수를 입력하세요.');return;}
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const s=sheet_('codes');const old=new Set(s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,1).getValues().flat():[]);
    const rows=[];
    while(rows.length<count){
      const code=Utilities.getUuid().replace(/-/g,'').slice(0,20).toUpperCase();
      if(old.has(code))continue;old.add(code);rows.push([code,false,'','','']);
    }
    s.getRange(s.getLastRow()+1,1,rows.length,5).setValues(rows);
    s.setColumnWidth(1,230);
    ui.alert('발급 완료: '+rows.length+'개. [참여코드] 탭의 A열에서 학생별로 하나씩 배부하세요. 코드 전체 목록을 공개 게시하지 마세요.');
  } finally {lock.releaseLock();}
}
function showSurveyStatus(){
  const settings=getSettings_();const codes=sheet_('codes'); const answers=sheet_('responses');
  SpreadsheetApp.getUi().alert('운영 중: '+(settings.isOpen?'예':'아니오')+'\n전체 발급 코드: '+Math.max(0,codes.getLastRow()-1)+'\n제출한 응답: '+Math.max(0,answers.getLastRow()-1));
}
function getSettings_(){
 const cells=sheet_('settings').getRange('A2:B4').getValues();const v=Object.fromEntries(cells);
 const closed=v.CLOSE_AT && new Date(v.CLOSE_AT).getTime()<=Date.now();
 return {isOpen:(v.IS_OPEN===true||String(v.IS_OPEN).toUpperCase()==='TRUE')&&!closed, max: Math.max(1,Math.min(3,Number(v.MAX_CHOICES)||3))};
}
function doGet() {
 return HtmlService.createHtmlOutput(page_('수요조사 접수 서버','웹앱 서버가 연결되어 있습니다. 수요조사는 학교에서 안내한 GitHub Pages 링크로 참여해 주세요.',true));
}
function doPost(e) {
 try {
   if(!e?.parameter?.payload || e.parameter.payload.length>3500)throw Error('요청 형식이 올바르지 않습니다.');
   const data=JSON.parse(e.parameter.payload);
   submit_(data);
   return HtmlService.createHtmlOutput(page_('응답 제출 완료','희망 과목이 정상적으로 접수되었습니다. 설문에 참여해 주셔서 감사합니다.',true));
 } catch(error){
   const allowed=['이미 사용된 참여 코드입니다.','참여 코드가 정확하지 않습니다.','설문이 마감되었습니다.','학년 또는 과목 선택을 확인해 주세요.','참여 코드를 입력해 주세요.','선택 과목 수를 확인해 주세요.'];
   const msg=allowed.includes(error.message)?error.message:'응답을 처리하지 못했습니다. 담당 교사에게 문의해 주세요.';
   console.error(error);
   return HtmlService.createHtmlOutput(page_('제출 실패',msg,false));
 }
}
function page_(title, description, ok){
 const safe=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 return '<!doctype html><html lang="ko"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><title>'+safe(title)+'</title><style>body{font-family:system-ui,-apple-system,sans-serif;background:#f4f8fa;margin:0;min-height:100vh;display:grid;place-items:center;color:#122f45}.card{background:white;border:1px solid #e2e9eb;border-radius:24px;max-width:430px;padding:38px 26px;margin:18px;text-align:center;box-shadow:0 10px 40px #1232}h1{font-size:25px}p{line-height:1.8;color:#536579}.tag{color:'+ (ok?'#077b73':'#bd493a') +';font-size:34px}a{color:#087e76}</style></head><body><main class="card"><div class="tag">'+(ok?'✓':'!')+'</div><h1>'+safe(title)+'</h1><p>'+safe(description)+'</p><p>이 창을 닫거나 이전 화면으로 돌아가세요.</p></main></body></html>';
}
function submit_(input){
 if(!input||![2,3].includes(Number(input.grade)))throw Error('학년 또는 과목 선택을 확인해 주세요.');
 const code=String(input.code||'').trim().toUpperCase();
 if(!/^[0-9A-F]{20}$/.test(code))throw Error('참여 코드를 입력해 주세요.');
 const ids=input.courseIds;
 if(!Array.isArray(ids)||ids.length<1||ids.length>3||new Set(ids).size!==ids.length||ids.some(x=>!Number.isSafeInteger(x)))throw Error('선택 과목 수를 확인해 주세요.');
 const lock=LockService.getScriptLock();lock.waitLock(25000);
 try {
   const s=getSettings_();if(!s.isOpen)throw Error('설문이 마감되었습니다.');
   if(ids.length>s.max)throw Error('선택 과목 수를 확인해 주세요.');
   const available=sheet_('courses').getDataRange().getValues();
   const courses=new Map(available.slice(1).map(row=>[Number(row[0]),String(row[1])]));
   if(ids.some(id=>!courses.has(id)))throw Error('학년 또는 과목 선택을 확인해 주세요.');
   const codes=sheet_('codes'),data=codes.getLastRow()>1?codes.getRange(2,1,codes.getLastRow()-1,5).getValues():[];
   const idx=data.findIndex(row=>String(row[0])===code);
   if(idx===-1)throw Error('참여 코드가 정확하지 않습니다.');
   if(data[idx][1]===true||String(data[idx][1]).toUpperCase()==='TRUE')throw Error('이미 사용된 참여 코드입니다.');
   const now=new Date(),sid=Utilities.getUuid(),grade=Number(input.grade);
   const responses=sheet_('responses');
   responses.appendRow([sid,now,grade,code,ids.length]);
   const selections=sheet_('selections');
   selections.getRange(selections.getLastRow()+1,1,ids.length,5).setValues(ids.map(id=>[now,grade,courses.get(id),id,sid]));
   codes.getRange(idx+2,2,1,4).setValues([[true,now,grade,sid]]);
   SpreadsheetApp.flush();
 } finally {lock.releaseLock();}
}