// 이 파일은 학생이 같은 프로젝트에서 이어서 구현합니다.
// 제공 UI를 받은 것만으로 단계 완료를 인정하지 않습니다.
export function createStudentView() {
  return {
    renderIdentity({ me, devices, sessions } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '내 로그인·기기·세션 상태');
      const line = (value) => {
        const p = document.createElement('p');
        p.textContent = String(value);
        root.appendChild(p);
      };
      const inputs = [me, devices, sessions];
      if (inputs.some((entry) => entry?.mode === 'demo')) line('예제 자료: 실제 회사 계정 정보가 아닙니다.');
      if (inputs.some((entry) => entry?.mode === 'disconnected')) line('연결 없음: 실제 서버와 연결되지 않았습니다.');
      if (inputs.some((entry) => entry?.mode === 'unknown')) line('확인 불가: 연결 상태를 확인할 수 없습니다.');

      // 매 호출마다 새 DOM을 반환하며 실패·대기 중에는 과거 계정 값을 표시하지 않습니다.
      if (inputs.some((entry) => entry?.status === 'error')) {
        for (const entry of inputs) {
          if (entry?.status === 'error') line('연결 실패: ' + (entry.error?.message ?? '서버 정보를 확인할 수 없습니다.'));
        }
        return root;
      }
      if (inputs.some((entry) => entry?.status === 'loading')) {
        line('로그인·기기·세션 정보를 불러오는 중입니다.');
        return root;
      }
      if (inputs.some((entry) => entry?.status !== 'ok')) {
        line('확인 불가: 아직 검증된 로그인·기기·세션 정보가 없습니다.');
        return root;
      }

      const identity = me?.data;
      if (!identity?.user || !identity?.device || !identity?.session ||
          !Array.isArray(devices?.data) || !Array.isArray(sessions?.data)) {
        line('확인 불가: 서버에서 필요한 정보를 받지 못했습니다.');
        return root;
      }
      const deviceStates = {
        compliant: '보안 기준 충족',
        noncompliant: '보안 기준 미충족',
        unknown: '확인 불가',
      };
      const sessionStates = {
        active: '활성',
        expired: '만료',
        revoked: '철회됨',
        unknown: '확인 불가',
      };
      const device = devices.data.find((entry) => entry?.id === identity.device.id) ?? identity.device;
      const session = sessions.data.find((entry) => entry?.id === identity.session.id) ?? identity.session;
      const deviceStatus = deviceStates[device?.status] ?? '확인 불가';
      const sessionStatus = sessionStates[session?.status] ?? '확인 불가';
      line('사용자: ' + (identity.user.label ?? '확인 불가') + ' / ID: ' + (identity.user.id ?? '확인 불가'));
      line('기기: ' + (device.label ?? identity.device.label ?? '확인 불가') +
        ' / ID: ' + (device.id ?? identity.device.id ?? '확인 불가') +
        ' / 상태: ' + deviceStatus + ' (' + (device.status ?? 'unknown') + ')');
      line('세션 ID: ' + (session.id ?? identity.session.id ?? '확인 불가') +
        ' / 상태: ' + sessionStatus + ' (' + (session.status ?? 'unknown') + ')');
      if (device?.status !== 'compliant' || session?.status !== 'active') {
        line('주의: 기기 보안 기준 또는 세션 활성 상태를 확인해야 합니다.');
      }
      return root;
    },
    renderDecision({ status, mode, data, error, appId } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '업무 앱 접근 판정');
      const line = (value) => {
        const p = document.createElement('p');
        p.textContent = String(value);
        root.appendChild(p);
      };
      if (mode === 'demo') line('예제 자료: 실제 접근 판정이 아닙니다.');
      if (mode === 'disconnected') line('연결 없음: 실제 서버에 연결되지 않았습니다.');
      if (mode === 'unknown') line('연결 상태 확인 불가');

      if (status === 'idle') {
        line('업무 앱을 선택하고 접근 요청을 하세요.');
        return root;
      }
      if (status === 'loading') {
        line('접근 판정 확인 중입니다.');
        return root;
      }
      if (status === 'error') {
        line('접근 요청 실패: ' + (error?.message ?? '서버 응답을 확인할 수 없습니다.'));
        line('요청 실패는 접근 거부(deny) 판정이 아닙니다.');
        return root;
      }
      if (status !== 'ok' || !data || typeof data !== 'object') {
        line('판정 확인 불가(unknown): 검증된 응답이 없습니다.');
        return root;
      }

      const decisions = {
        allow: '접근 허용',
        deny: '접근 거부',
        challenge: '추가 인증 또는 확인 필요',
        unknown: '판정 확인 불가',
      };
      const decision = Object.hasOwn(decisions, data.decision) ? data.decision : 'unknown';
      line('업무 앱 ID: ' + (data.appId ?? appId ?? '확인 불가'));
      line('접근 판정: ' + decisions[decision] + ' (' + decision + ')');
      line('판정 이유: ' + (data.reason ?? '확인 불가'));
      line('판정 시각: ' + (data.checkedAt ?? '확인 불가'));
      if (decision === 'allow') line('정책상 접근 허용이며 실제 업무 앱 접속 성공을 보장하지 않습니다.');
      if (decision === 'challenge') line('추가 인증 또는 확인이 필요합니다. 이 앱은 해당 절차를 대신 수행하지 않습니다.');
      if (decision === 'unknown') line('접근 허용 여부를 확인할 수 없습니다.');
      return root;
    },
    renderEvents({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '내 접속 기록과 XDR 경보');
      const add = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.appendChild(node);
        return node;
      };
      if (mode === 'demo') add(root, 'p', '예제 자료: 실제 보안 기록이 아닙니다.');
      if (mode === 'disconnected') add(root, 'p', '연결 없음: 서버와 연결되지 않았습니다.');
      if (mode === 'unknown') add(root, 'p', '연결 상태 확인 불가');
      if (status === 'loading') {
        add(root, 'p', '보안 기록을 불러오는 중입니다.');
        return root;
      }
      if (status === 'error') {
        const mismatch = error?.code === 'CONTRACT_MISMATCH';
        add(root, 'p', (mismatch ? '기록 확인 불가: ' : '기록을 불러오지 못했습니다: ') +
          (error?.message ?? '서버 응답을 확인할 수 없습니다.'));
        return root;
      }
      if (status !== 'ok' || !Array.isArray(data)) {
        add(root, 'p', '기록 확인 불가: 검증된 목록이 없습니다.');
        return root;
      }
      if (data.length === 0) {
        add(root, 'p', '표시할 기록이 없습니다.');
        return root;
      }

      // 원본 응답은 변경하지 않으며 현재 전달받은 목록 안에서만 정렬·필터링합니다.
      const events = [...data].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
      const accessLabels = { allowed: '접근 허용', denied: '접근 거부', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const stateText = (labels, value) => (labels[value] ?? '확인 불가') + '(' + (value ?? 'unknown') + ')';
      const controls = document.createElement('div');
      root.appendChild(controls);
      const filters = {};
      const makeFilter = (title, values, valueLabel) => {
        const label = document.createElement('label');
        label.textContent = title + ': ';
        const select = document.createElement('select');
        const all = document.createElement('option');
        all.value = 'all';
        all.textContent = '전체';
        select.appendChild(all);
        for (const value of values) {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = valueLabel(value);
          select.appendChild(option);
        }
        label.appendChild(select);
        controls.appendChild(label);
        filters[title] = select;
      };
      makeFilter('기록 종류', [...new Set(events.map((event) => event.kind))],
        (value) => value === 'access' ? '접속 기록(access)' : value === 'xdr' ? 'XDR 경보(xdr)' : value);
      makeFilter('업무 앱', [...new Set(events.map((event) => event.appId ?? ''))],
        (value) => value || '앱 확인 불가');
      makeFilter('접속 상태', [...new Set(events.map((event) => event.state?.access ?? 'unknown'))],
        (value) => stateText(accessLabels, value));

      const count = add(root, 'p', '');
      const list = document.createElement('ul');
      root.appendChild(list);
      const renderList = () => {
        list.replaceChildren();
        const shown = events.filter((event) =>
          (filters['기록 종류'].value === 'all' || event.kind === filters['기록 종류'].value) &&
          (filters['업무 앱'].value === 'all' || (event.appId ?? '') === filters['업무 앱'].value) &&
          (filters['접속 상태'].value === 'all' || (event.state?.access ?? 'unknown') === filters['접속 상태'].value));
        count.textContent = '표시 기록: ' + shown.length + '건 / 조회된 기록: ' + events.length + '건';
        if (shown.length === 0) add(list, 'li', '필터 조건에 맞는 기록이 없습니다.');
        for (const event of shown) {
          const item = document.createElement('li');
          item.setAttribute('data-student-event-id', String(event.id));
          add(item, 'p', '기록 ID: ' + event.id + ' / 시각: ' + event.at +
            ' / 종류: ' + (event.kind === 'access' ? '접속 기록(access)' : event.kind === 'xdr' ? 'XDR 경보(xdr)' : event.kind) +
            ' / 앱: ' + (event.appId ?? '앱 확인 불가') + ' / 요약: ' + event.summary);
          const button = add(item, 'button', event.id + ' 상세');
          button.type = 'button';
          button.setAttribute('aria-expanded', 'false');
          const detail = document.createElement('div');
          item.appendChild(detail);
          button.addEventListener('click', () => {
            if (button.getAttribute('aria-expanded') === 'true') {
              detail.replaceChildren();
              detail.removeAttribute('data-student-event-detail');
              button.setAttribute('aria-expanded', 'false');
              return;
            }
            detail.replaceChildren();
            detail.setAttribute('data-student-event-detail', String(event.id));
            add(detail, 'p', '기록 ID: ' + event.id + ' / 앱 ID: ' + (event.appId ?? '앱 확인 불가'));
            add(detail, 'p', '근거');
            if (event.evidence.length === 0) add(detail, 'p', '제공된 근거 없음');
            for (const evidence of event.evidence) add(detail, 'p', evidence.id + ' — ' + evidence.text);
            add(detail, 'p', '규칙');
            if (event.rules.length === 0) add(detail, 'p', '제공된 규칙 없음');
            for (const rule of event.rules) add(detail, 'p', rule.id + ' — ' + rule.text);
            add(detail, 'p', '접속 상태: ' + stateText(accessLabels, event.state.access));
            add(detail, 'p', '세션 상태: ' + stateText(sessionLabels, event.state.session));
            add(detail, 'p', '기기 상태: ' + stateText(deviceLabels, event.state.device));
            if (Array.isArray(event.supportedActions)) {
              for (const action of event.supportedActions) {
                add(detail, 'p', '조치 실행 연결은 준비 중입니다.');
                const buttonUnsupported = add(detail, 'button', String(action) + ' 미지원');
                buttonUnsupported.type = 'button';
                buttonUnsupported.disabled = true;
              }
            }
            button.setAttribute('aria-expanded', 'true');
          });
          list.appendChild(item);
        }
      };
      for (const select of Object.values(filters)) select.addEventListener('change', renderList);
      renderList();
      return root;
    },
    renderStatus({ devices, sessions, notifications, diagnostics, mode } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '기기·세션·알림·진단 상태');
      const add = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.appendChild(node);
        return node;
      };
      if (mode === 'demo') add(root, 'p', '예제 자료: 실제 계정의 상태가 아닙니다.');
      if (mode === 'disconnected') add(root, 'p', '연결 없음: 실제 서버와 연결되지 않았습니다.');
      if (mode === 'unknown') add(root, 'p', '연결 상태 확인 불가');

      const deviceLabels = { compliant: '보안 기준 충족', noncompliant: '보안 기준 미충족', unknown: '확인 불가' };
      const sessionLabels = { active: '활성', expired: '만료', revoked: '철회됨', unknown: '확인 불가' };
      const stateText = (labels, value) => (labels[value] ?? '확인 불가') + '(' + (value ?? 'unknown') + ')';
      const renderResource = (title, resource, emptyText, labels, rowText) => {
        add(root, 'h3', title);
        if (resource?.status === 'loading') {
          add(root, 'p', title + ' 정보를 불러오는 중입니다.');
        } else if (resource?.status === 'error') {
          add(root, 'p', title + ' 정보를 불러오지 못했습니다: ' +
            (resource.error?.message ?? '조회 실패'));
          add(root, 'p', '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.');
        } else if (resource?.status === 'ok' && Array.isArray(resource.data)) {
          if (resource.data.length === 0) add(root, 'p', emptyText);
          for (const item of resource.data) add(root, 'p', rowText(item) + ' / 상태: ' + stateText(labels, item.status));
        } else {
          add(root, 'p', title + ' 정보 확인 불가');
        }
      };
      renderResource('기기', devices, '등록된 기기가 없습니다.', deviceLabels,
        (device) => '기기: ' + (device.label ?? device.id ?? '확인 불가'));
      add(root, 'p', '등록 기기는 현재 계정의 회수되지 않은 기기 최대 100개까지 확인합니다.');
      renderResource('세션', sessions, '현재 연결이 없습니다.', sessionLabels,
        (session) => '세션 ID: ' + (session.id ?? '확인 불가'));
      add(root, 'p', '세션 조회는 지금 검증된 연결 하나만 대상으로 하며 지난 세션 전체 목록이 아닙니다.');

      add(root, 'h3', '알림');
      if (!Array.isArray(notifications) || notifications.length === 0) {
        add(root, 'p', '주의할 알림이 없습니다.');
      } else {
        for (const notice of notifications) {
          add(root, 'p', '자료: ' + (notice.resource ?? '확인 불가') +
            ' / 코드: ' + (notice.code ?? '확인 불가') +
            ' / 내용: ' + (notice.message ?? '확인 불가'));
        }
      }

      add(root, 'h3', '진단 정보');
      const safeKeys = ['requestId', 'component', 'version', 'checkedAt'];
      const safeDiagnostics = {};
      if (diagnostics?.status === 'ok' && diagnostics.data && typeof diagnostics.data === 'object') {
        for (const key of safeKeys) safeDiagnostics[key] = diagnostics.data[key] ?? '확인 불가';
        safeDiagnostics['engine.mode'] = diagnostics.data.engine?.mode ?? '확인 불가';
        safeDiagnostics['engine.code'] = diagnostics.data.engine?.code ?? '확인 불가';
        for (const [key, value] of Object.entries(safeDiagnostics)) add(root, 'p', key + ': ' + String(value));
      } else if (diagnostics?.status === 'loading') {
        add(root, 'p', '진단 정보를 불러오는 중입니다.');
      } else if (diagnostics?.status === 'error') {
        add(root, 'p', '진단 정보를 불러오지 못했습니다: ' +
          (diagnostics.error?.message ?? '조회 실패'));
        add(root, 'p', '다시 시도는 위쪽 다시 불러오기 버튼을 직접 누르세요.');
      } else {
        add(root, 'p', '진단 정보 확인 불가');
      }
      add(root, 'p', '도움 요청 시 비밀 정보가 아닌 진단 항목만 복사할 수 있습니다.');
      const copy = add(root, 'button', '도움정보 복사');
      copy.type = 'button';
      copy.disabled = diagnostics?.status !== 'ok';
      copy.addEventListener('click', async () => {
        if (diagnostics?.status !== 'ok') return;
        const payload = Object.entries(safeDiagnostics).map(([key, value]) => key + ': ' + String(value)).join('\\n');
        try {
          await navigator.clipboard.writeText(payload);
          feedback.textContent = '도움정보를 복사했습니다.';
        } catch {
          feedback.textContent = '도움정보를 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인하세요.';
        }
      });
      const feedback = add(root, 'p', '');
      feedback.setAttribute('role', 'status');
      return root;
    },
    renderVulnerabilities() { return '학생 구현 대기: 정확한 설치 버전·OSV 출처·조회 시각·부분 결과·조회 실패를 구분하세요.'; },
    renderAiConnection() { return '학생 구현 대기: 모델 응답 점검과 실제 사건 설명을 구분하고 AI 오류·취소·수동 복구를 안내하세요.'; },
    renderExplanation() { return '학생 구현 대기: 선택한 사건의 근거·규칙·현재 상태와 AI 설명을 연결하세요. 제안은 자동 실행하지 않습니다.'; },
    renderAction() { return '학생 구현 대기: 현재 사건·조치·실제 대상·사람 확인·ACK와 원천 효과·unknown을 구분하세요.'; },
  };
}
