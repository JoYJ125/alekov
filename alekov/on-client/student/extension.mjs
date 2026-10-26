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
    renderVulnerabilities({ status, mode, data, error } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '설치 패키지와 OSV 취약점 조회 결과');
      const add = (parent, tag, value) => {
        const node = document.createElement(tag);
        node.textContent = String(value);
        parent.appendChild(node);
        return node;
      };
      if (mode === 'demo') add(root, 'p', '예제 자료: 실제 설치 패키지 조회 결과가 아닙니다.');
      if (mode === 'disconnected') add(root, 'p', '연결 없음: 실제 서버의 조회 결과가 아닙니다.');
      if (mode === 'unknown') add(root, 'p', '연결 상태 확인 불가');
      // 매 호출마다 새 DOM을 만들고, 현재 조회가 아닌 표는 표시하지 않습니다.
      if (status === 'idle') {
        add(root, 'p', '조회 전(idle): 설치 패키지 취약점 조회를 아직 시작하지 않았습니다.');
        return root;
      }
      if (status === 'loading') {
        add(root, 'p', '조회 중(loading): 현재 요청 결과를 기다리고 있습니다. 이전 조회 결과는 표시하지 않습니다.');
        return root;
      }
      if (status === 'error') {
        add(root, 'p', '조회 실패(error): ' + (error?.message ?? '조회 결과를 확인할 수 없습니다.'));
        if (error?.code != null) add(root, 'p', '오류 코드: ' + error.code);
        add(root, 'p', '조회 실패는 취약점이 없다는 뜻이 아닙니다.');
        return root;
      }
      if (status !== 'ok' || !data || typeof data !== 'object') {
        add(root, 'p', '조회 결과 확인 불가: 유효한 조회 자료가 없습니다.');
        return root;
      }

      const overallLabels = {
        complete: '모두 조회',
        partial: '일부 조회 실패',
        not_checked: '아직 조회 안 함',
        not_configured: '조회 대상 프로젝트 설정 필요',
        unverifiable: 'lock 파일 확인 불가',
      };
      const packageLabels = {
        known_vulnerabilities: '알려진 취약점 항목 있음',
        none_found: '조회 범위에서 알려진 취약점 항목 없음',
        unverifiable: '조회 확인 불가',
      };
      add(root, 'p', '전체 조회 상태: ' + (overallLabels[data.status] ?? '확인 불가') + '(' + (data.status ?? 'unknown') + ')');
      if (data.status === 'not_checked') add(root, 'p', '승인된 공개 조회 대상이 없거나 아직 조회하지 않았습니다. 취약점 없음으로 판단하지 마세요.');
      if (data.status === 'not_configured') add(root, 'p', '담당자의 조회 대상 프로젝트 설정이 필요합니다. 학생이 설정을 임의로 변경하지 않습니다.');
      if (data.status === 'unverifiable') add(root, 'p', '설치 버전의 근거가 되는 lock 파일을 확인할 수 없습니다.');
      if (data.status === 'partial') add(root, 'p', '일부 조회가 실패했습니다. 확인된 취약점은 유지하되 전체 결과가 완전하다고 판단하지 마세요.');
      if (data.lockfileVersion != null) add(root, 'p', 'lockfileVersion: ' + data.lockfileVersion);
      if (data.lockfileHash != null) add(root, 'p', 'lockfileHash: ' + data.lockfileHash);
      if (data.checkedAt != null) add(root, 'p', '전체 조회 시각: ' + data.checkedAt);

      if (!Array.isArray(data.packages) || data.packages.length === 0) {
        add(root, 'p', '표시할 확인된 패키지 조회 결과가 없습니다. 미조회·실패는 취약점 없음이 아닙니다.');
        return root;
      }
      const list = document.createElement('ul');
      root.appendChild(list);
      for (const pkg of data.packages) {
        const item = document.createElement('li');
        list.appendChild(item);
        if (pkg?.name != null) item.setAttribute('data-student-package-name', String(pkg.name));
        if (pkg?.version != null) item.setAttribute('data-student-package-version', String(pkg.version));
        add(item, 'p', '패키지 이름: ' + (pkg?.name ?? '확인 불가'));
        add(item, 'p', '설치된 정확한 버전: ' + (pkg?.version ?? '확인 불가'));
        add(item, 'p', '패키지 조회 상태: ' +
          (packageLabels[pkg?.status] ?? '확인 불가') + '(' + (pkg?.status ?? 'unknown') + ')');
        if (pkg?.source != null) add(item, 'p', '조회 출처: ' + pkg.source);
        if (pkg?.checkedAt != null) add(item, 'p', '패키지 확인 시각: ' + pkg.checkedAt);
        const vulnerabilities = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];
        if (pkg?.status === 'unverifiable' && vulnerabilities.length > 0) {
          add(item, 'p', '일부 확인·전체 조회 확인 불가: 이미 확인된 취약점 정보만 표시합니다.');
        }
        if (pkg?.status === 'none_found') {
          add(item, 'p', '해당 조회 범위에서 알려진 항목이 없다는 뜻이며, 패키지나 앱의 안전을 보장하지 않습니다.');
        }
        for (const vulnerability of vulnerabilities) {
          if (vulnerability?.id != null) add(item, 'p', '취약점 ID: ' + vulnerability.id +
            (vulnerability.modified != null ? ' / 수정 시각: ' + vulnerability.modified : ' / 수정 시각: 확인 불가'));
        }
      }
      add(root, 'p', 'OSV 조회 결과는 알려진 취약점 정보이며, 취약점 미발견은 안전 보장이 아닙니다.');
      return root;
    },
    renderAiConnection({ status, mode, data, error, checkedAt, explanationAccepted } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '앱 내부 AI 연결 상태');
      const line = (value) => {
        const p = document.createElement('p');
        p.textContent = String(value);
        root.appendChild(p);
      };
      if (mode === 'demo') line('예제 자료: 실제 AI 연결 결과가 아닙니다.');
      if (mode === 'disconnected') line('연결 없음: 실제 서버와 연결되지 않았습니다.');
      if (mode === 'unknown') line('연결 상태 확인 불가');
      if (status === 'idle') {
        line('AI 연결 점검 전');
        line('계정과 AI 연결을 확인한 뒤 현재 API 연결 점검 버튼을 직접 누르세요.');
        return root;
      }
      if (status === 'loading') {
        line('AI 연결 점검 중');
        line('이전 점검 결과는 현재 결과가 아닙니다.');
        return root;
      }
      if (status === 'ok') {
        const auth = data?.audienceAuthorization;
        if (data?.transportChecked !== true || (auth !== 'test' && auth !== 'verified')) {
          line('AI 연결 결과 확인 불가: 점검 응답이 유효하지 않습니다.');
          return root;
        }
        line(auth === 'test' ? '시험 연결 점검(test)' : '앱 권한 확인 후 점검(verified)');
        line('모델 수: ' + (data.modelCount ?? '확인 불가'));
        line('점검 시각: ' + (checkedAt ?? '확인 불가'));
        line('연결 점검 결과이며 사건 설명은 아직 실행하지 않았습니다.');
        return root;
      }
      if (status === 'error') {
        const code = String(error?.code ?? 'UNKNOWN');
        const advice = (() => {
          if (/CANCEL|ABORT/i.test(code)) return '점검이 취소되었습니다. 이전 결과는 현재 결과가 아닙니다.';
          if (/MODEL.*(NONE|EMPTY|UNAVAILABLE|NOT_FOUND)|NO_MODEL/i.test(code)) return '사용 가능한 모델이 없습니다. 담당자에게 모델 허용 설정을 확인하세요.';
          if (/TIMEOUT|TIMED_OUT|NETWORK|FETCH|RATE_LIMIT|TOO_MANY|429/i.test(code)) return '요청 제한·시간 초과·네트워크 상태를 확인하고 잠시 뒤 직접 다시 점검하세요.';
          if (/HOURS|TIME_WINDOW|OUT_OF_HOURS|SCHEDULE|WB_CLCO_SESSION_CLOSED/i.test(code)) return '이용 시간이 아닙니다. 이용 시간을 확인하세요.';
          if (/QUOTA|USAGE|BUDGET|LIMIT_EXCEEDED|LIMIT_REACHED|CAPACITY/i.test(code)) return '수업 사용량 또는 이용 한도에 도달했습니다. 담당자에게 확인하세요.';
          if (/FORBIDDEN|DENIED|ACCESS_RESTRICTED|ACCESS_BLOCKED|403/i.test(code)) return '접근이 제한되었습니다. 계정 연결과 담당자 확인이 필요합니다.';
          if (/UNAUTHORIZED|AUTH|TOKEN_EXPIRED|401/i.test(code)) return '인증을 확인할 수 없습니다. 계정 연결을 다시 확인하고 담당자에게 문의하세요.';
          return '앱 권한이 준비되지 않았거나 연결 상태를 확인할 수 없습니다. 담당자에게 계정 연결과 앱 권한을 확인하세요.';
        })();
        line('AI 연결 점검 실패 (' + code + '): ' + (error?.message ?? '확인할 수 없습니다.'));
        line(advice);
        line('사건 설명은 실행된 것으로 확인되지 않았습니다.');
        return root;
      }
      line('AI 연결 상태 확인 불가');
      return root;
    },
    renderExplanation({ event, explanation, checkedAt } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '선택한 사건의 AI 설명');
      const line = (value) => {
        const p = document.createElement('p');
        p.textContent = String(value);
        root.appendChild(p);
      };
      const failure = (reason, code) => {
        line('AI 설명을 사용할 수 없습니다: ' + reason + (code ? ' (' + code + ')' : ''));
        line('보안 기록은 그대로입니다. AI 설명 실패는 과제 실패나 보안 조치 실행을 뜻하지 않습니다.');
        return root;
      };
      // 오류는 사건 선택 여부보다 먼저 처리합니다.
      if (explanation?.status === 'error') {
        line('AI 설명 실패 (' + (explanation.error?.code ?? 'UNKNOWN') + '): ' +
          (explanation.error?.message ?? '설명 결과를 확인할 수 없습니다.'));
        line('보안 기록은 그대로입니다. AI 설명 실패는 과제 실패나 보안 조치 실행을 뜻하지 않습니다.');
        return root;
      }
      if (!event?.id) {
        line('보안 기록에서 기록을 먼저 고르세요.');
        return root;
      }
      if (explanation?.status === 'loading') {
        line('사건 ' + event.id + '의 AI 설명 요청 중입니다.');
        return root;
      }
      if (explanation?.status !== 'ok') {
        line('사건 ' + event.id + '의 AI 설명은 아직 확인되지 않았습니다.');
        return root;
      }

      const data = explanation.data;
      if (!data || typeof data.summary !== 'string' ||
          !Array.isArray(data.evidenceIds) || !Array.isArray(data.proposals)) {
        return failure('설명 자료가 부족하거나 응답 형식이 맞지 않습니다.', explanation.error?.code);
      }
      if (data.executed !== false || data.requiresHumanConfirmation !== true) {
        return failure('조치 실행 여부 또는 사람 확인 조건을 검증할 수 없습니다. 실행되었다는 AI 응답은 사용할 수 없습니다.', explanation.error?.code);
      }
      if (!Array.isArray(event.evidence) || !Array.isArray(event.rules)) {
        return failure('현재 사건의 근거 또는 규칙 자료가 없습니다.', explanation.error?.code);
      }
      const evidenceById = new Map(event.evidence.map((item) => [item.id, item]));
      const cited = new Set();
      for (const id of data.evidenceIds) {
        if (!evidenceById.has(id) || cited.has(id)) {
          return failure('인용한 근거 ID가 현재 사건의 근거와 일치하지 않거나 중복되었습니다.', explanation.error?.code);
        }
        cited.add(id);
      }
      if (cited.size !== event.evidence.length) {
        return failure('현재 사건의 근거가 빠져 있어 설명을 사용할 수 없습니다.', explanation.error?.code);
      }
      const supported = Array.isArray(event.supportedActions) ? event.supportedActions : [];
      for (const proposal of data.proposals) {
        if (!proposal || typeof proposal.action !== 'string' ||
            typeof proposal.reason !== 'string' || !Array.isArray(proposal.evidenceIds) ||
            !supported.includes(proposal.action) ||
            proposal.evidenceIds.some((id) => !evidenceById.has(id))) {
          return failure('제안 조치 또는 제안 근거가 현재 사건과 일치하지 않습니다.', explanation.error?.code);
        }
      }
      // 검증이 끝난 현재 사건의 설명에만 성공 표식을 부여합니다.
      root.setAttribute('data-student-explanation-event', String(event.id));
      line('사건 ID: ' + event.id);
      line('AI 설명(참고용): ' + data.summary);
      line('AI 설명은 해석이며 사실 판단은 아래 근거와 연동 시스템의 현재 상태를 기준으로 합니다.');
      line('인용한 근거:');
      for (const id of data.evidenceIds) {
        line('근거 ' + id + ' — ' + (evidenceById.get(id).text ?? '근거 글 확인 불가'));
      }
      line('적용 규칙:');
      if (event.rules.length === 0) line('규칙 없음');
      for (const rule of event.rules) {
        line('규칙 ' + rule.id + ' — ' + (rule.text ?? '규칙 글 확인 불가'));
      }
      const unknown = [
        ['접속', event.state?.access],
        ['세션', event.state?.session],
        ['기기', event.state?.device],
      ].filter(([, value]) => value === 'unknown');
      line('확인 불가 상태:');
      if (unknown.length === 0) line('없음');
      for (const [label, value] of unknown) line(label + ': 확인 불가(' + value + ')');
      if (data.proposals.length === 0) {
        line(supported.length === 0
          ? '연동 시스템이 지원하는 조치가 없어 제안이 없습니다(정상).'
          : 'AI가 제안한 조치가 없습니다.');
      } else {
        for (const proposal of data.proposals) {
          line('제안 조치: ' + proposal.action + ' — 이유: ' + proposal.reason);
          line('제안 근거 ID: ' + proposal.evidenceIds.join(', '));
          line('사람 확인이 필요하며 아직 실행되지 않았습니다.');
        }
      }
      line('AI 설명과 제안은 보안 조치를 실행하지 않습니다.');
      return root;
    },
    renderAction({ status, event, actionId, target, receipt, observation, message, confirmationExpiresAt, error } = {}) {
      const root = document.createElement('section');
      root.setAttribute('aria-label', '보안 조치 요청과 연동 시스템 결과');
      const line = (value) => {
        const p = document.createElement('p');
        p.textContent = String(value);
        root.appendChild(p);
      };
      const current = status ?? 'idle';
      const outcomeUnknown = () => {
        line('결과 불명(unknown): 실제 조치 효과를 확인할 수 없습니다.');
        line('성공이나 효과 없음으로 판단하지 말고 연동 시스템 결과만 재조회하세요.');
      };
      // 이전 요청의 값이 섞이지 않도록 전달받은 값만으로 새 요소를 만듭니다.
      switch (current) {
        case 'idle':
          line('아직 미실행(idle): 조치 요청을 시작하지 않았습니다.');
          break;
        case 'loading':
          line('조회 중(loading): 조치 준비 또는 결과 조회 중입니다. 실행 결과는 아직 확인되지 않았습니다.');
          break;
        case 'prepared':
          line('준비됨·미실행(prepared): 사람 확인 전이며 서버에 조치를 실행하도록 요청하지 않았습니다.');
          if (confirmationExpiresAt != null) line('사람 확인 기한: ' + confirmationExpiresAt);
          line('실제 대상과 조치를 확인한 뒤 제공 화면에서 사람이 확인해야 합니다.');
          break;
        case 'executing':
          line('서버에 전달 중(executing): 요청을 전송하고 있으며 처리 결과는 아직 확인되지 않았습니다.');
          break;
        case 'pending':
          line('서버 접수·처리 중(pending): 접수 응답(ACK)은 조치 효과를 확인한 결과가 아닙니다.');
          break;
        case 'succeeded':
          if (observation?.effectApplied === true && observation?.observedAt != null &&
              receipt?.receiptId != null) {
            line('효과 확인(succeeded): 연동 시스템이 조치 효과를 확인했습니다.');
            line('관측 시각: ' + observation.observedAt);
            line('effectApplied: true');
            line('접수 ID(receiptId): ' + receipt.receiptId);
          } else {
            outcomeUnknown();
          }
          break;
        case 'denied':
          line('연동 시스템 거절(denied): ' + (message ?? '거절 사유를 확인할 수 없습니다.'));
          break;
        case 'failed':
          line('연동 시스템 처리 실패(failed): ' + (message ?? '실패 사유를 확인할 수 없습니다.'));
          break;
        case 'unknown':
          outcomeUnknown();
          break;
        case 'expired':
          line('확인 기한 지남(expired): 이전 준비로는 조치를 진행할 수 없습니다. 새로 준비하세요.');
          break;
        case 'error':
          line('요청 처리 안 됨(error): ' + (error?.message ?? '오류 내용을 확인할 수 없습니다.'));
          if (error?.code != null) line('오류 코드: ' + error.code);
          break;
        default:
          line('상태 확인 불가(' + current + '): 처리 결과를 추정하지 마세요.');
      }

      // 현재 입력에 있는 식별자만 표시하며 새 식별자나 인증 티켓을 생성하지 않습니다.
      if (event?.id != null) line('사건 ID: ' + event.id);
      if (Array.isArray(event?.evidence)) {
        for (const item of event.evidence) {
          if (item?.id != null) line('근거 ID: ' + item.id);
        }
      }
      if (actionId != null) line('조치 ID: ' + actionId);
      if (target?.id != null) line('대상 ID: ' + target.id);
      if (target?.generation != null) line('대상 세대(generation): ' + target.generation);
      if (receipt?.requestId != null) line('요청 ID(requestId): ' + receipt.requestId);
      if (receipt?.receiptId != null && current !== 'succeeded') line('접수 ID(receiptId): ' + receipt.receiptId);
      if (receipt?.version != null) line('결과 버전(version): ' + receipt.version);

      // 현재 사건·요청과 접수 정보가 모순되지 않을 때만 식별 속성을 부여합니다.
      const matching = event?.id != null && receipt?.requestId != null &&
        (receipt.eventId == null || String(receipt.eventId) === String(event.id)) &&
        (receipt.actionId == null || String(receipt.actionId) === String(actionId)) &&
        !['idle', 'loading', 'error', 'expired'].includes(current);
      if (matching) {
        root.setAttribute('data-student-action-event', String(event.id));
        root.setAttribute('data-student-action-request', String(receipt.requestId));
      }
      if (Array.isArray(event?.supportedActions) && event.supportedActions.length === 0) {
        line('연동 시스템이 지원하는 조치가 없어 조치 준비를 진행할 수 없습니다.');
      }
      line('조치 요청과 결과 조회는 제공 화면에서만 진행합니다. 조치 화면 취소는 이미 전달된 조치 효과를 되돌리지 않습니다.');
      return root;
    },
  };
}
