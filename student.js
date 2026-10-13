import { GAS_WEB_APP_URL, IS_CONFIGURED } from './config.js';
const $ = id => document.getElementById(id);
let courses = [];
const selected = new Map();
const LIMIT = 3;
let visibleCount = 45, submitted = false;
const norm = s => String(s ?? '').normalize('NFKC').toLowerCase().replace(/\s/g, '');
const say = (message, bad = false) => { const el = $('submitStatus'); el.textContent = message; el.className = 'submit-status' + (bad ? ' problem' : ''); };
function updateSelection() {
  $('pickedCount').textContent = String(selected.size);
  const list = $('selectedList'); list.replaceChildren();
  if (!selected.size) { const p = document.createElement('p'); p.className = 'placeholder'; p.textContent = '아직 선택한 과목이 없습니다.'; list.append(p); }
  [...selected.values()].forEach((c, i) => {
    const item = document.createElement('div'); item.className = 'selected-item';
    const num = document.createElement('span'); num.className = 'selected-order'; num.textContent = String(i + 1);
    const name = document.createElement('span'); name.textContent = c.name;
    const del = document.createElement('button'); del.type = 'button'; del.className = 'remove-btn'; del.setAttribute('aria-label', c.name + ' 선택 취소'); del.textContent = '×';
    del.addEventListener('click', () => changeCourse(c)); item.append(num, name, del); list.append(item);
  });
  $('submitBtn').disabled = submitted || !IS_CONFIGURED || !selected.size || !$('surveyCode').value.trim();
}
function changeCourse(c) {
  if (submitted) return;
  if (selected.has(c.id)) selected.delete(c.id);
  else if (selected.size >= LIMIT) return say('최대 3과목까지 선택할 수 있습니다.', true);
  else selected.set(c.id, c);
  say(''); updateSelection(); renderCourses();
}
function matched() {
  const keyword = norm($('courseSearch').value); const track = $('trackFilter').value; const category = $('categoryFilter').value;
  return courses.filter(c => (!keyword || norm(c.name).includes(keyword)) && (track === 'all' || c.track === track) && (category === 'all' || c.category === category));
}
function updateCategories() {
  const select = $('categoryFilter'); const prev = select.value, track = $('trackFilter').value;
  const names = [...new Set(courses.filter(c => track === 'all' || c.track === track).map(c => c.category))].sort((a, b) => a.localeCompare(b, 'ko'));
  select.replaceChildren(new Option('전체 영역', 'all'), ...names.map(n => new Option(n, n)));
  select.value = names.includes(prev) ? prev : 'all';
}
function renderCourses() {
  const rows = matched(), root = $('courseList'); root.replaceChildren();
  $('resultCount').textContent = `검색 결과 ${rows.length.toLocaleString('ko-KR')}과목`;
  $('emptyCourses').hidden = rows.length !== 0;
  $('showMore').hidden = rows.length <= visibleCount;
  for (const c of rows.slice(0, visibleCount)) {
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'course-row' + (selected.has(c.id) ? ' chosen' : '');
    btn.setAttribute('aria-pressed', String(selected.has(c.id)));
    const content = document.createElement('div'); content.className = 'course-info';
    const title = document.createElement('strong'); title.className = 'course-name'; title.textContent = c.name;
    const meta = document.createElement('small'); meta.className = 'course-meta'; meta.textContent = `${c.track} · ${c.category} · ${c.kind}`;
    content.append(title, meta);
    const check = document.createElement('span'); check.className = 'course-check'; check.setAttribute('aria-hidden', 'true'); check.textContent = selected.has(c.id) ? '✓' : '+';
    btn.append(content, check); btn.addEventListener('click', () => changeCourse(c)); root.append(btn);
  }
}
$('courseSearch').addEventListener('input', () => { visibleCount = 45; renderCourses(); });
$('trackFilter').addEventListener('change', () => { updateCategories(); visibleCount = 45; renderCourses(); });
$('categoryFilter').addEventListener('change', () => { visibleCount = 45; renderCourses(); });
$('showMore').addEventListener('click', () => { visibleCount += 60; renderCourses(); });
$('surveyCode').addEventListener('input', () => { $('surveyCode').value = $('surveyCode').value.toUpperCase().replace(/[^0-9A-Z]/g, ''); updateSelection(); });
$('submitBtn').addEventListener('click', () => {
  if (!IS_CONFIGURED || submitted || !selected.size || !$('surveyCode').value.trim()) return;
  const grade = Number(document.querySelector('input[name="grade"]:checked')?.value);
  if (![2, 3].includes(grade)) return say('학년을 선택해 주세요.', true);
  const code = $('surveyCode').value.trim();
  if (code.length < 8 || code.length > 40) return say('참여 코드를 확인해 주세요.', true);
  if (!confirm(`${grade}학년 · ${selected.size}과목을 제출하시겠습니까? 제출 후 수정할 수 없습니다.`)) return;
  submitted = true; updateSelection(); say('안전한 제출 화면으로 이동합니다...');
  const form = document.createElement('form'); form.method = 'POST'; form.action = GAS_WEB_APP_URL; form.acceptCharset = 'UTF-8'; form.style.display = 'none';
  const input = document.createElement('input'); input.type = 'hidden'; input.name = 'payload';
  input.value = JSON.stringify({grade, code, courseIds: [...selected.keys()]});
  form.append(input); document.body.append(form); form.submit();
});
$('closeDialog').addEventListener('click', () => $('successDialog').close());
(async () => {
  try {
    const response = await fetch('./assets/courses.json');
    if (!response.ok) throw new Error('과목 데이터를 가져오지 못했습니다.');
    courses = await response.json();
    if (!courses.length) throw new Error('과목 목록이 비어 있습니다.');
    $('subjectCount').textContent = `총 ${courses.length}개 과목`;
    updateCategories(); renderCourses(); updateSelection();
  } catch (e) {
    $('loadNotice').hidden = false; $('loadNotice').textContent = `데이터 로딩 실패: ${e.message}`;
  }
  if (!IS_CONFIGURED) {
    $('setupNotice').hidden = false;
    $('setupNotice').textContent = '현재 화면은 시연용입니다. 실제 응답 저장을 시작하려면 담당 교사가 Google Apps Script를 배포하고 config.js에 웹앱 URL을 입력해야 합니다.';
    say('미리보기 모드에서는 실제 제출이 비활성화됩니다.');
  }
})();