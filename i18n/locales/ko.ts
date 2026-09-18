export default {
  common: {
    screen: {
      home: '홈',
      board: '게시판',
      notifications: '알림',
      mypage: '내 공간',
    },

    bingo: {
      bingo: '빙고',
      achieve: '달성',
      achieveDate: '달성일',
      endDate: '종료일',
      emptyBingo: '볼 수 없는 빙고예요.',
      memoPlaceholder: '메모를 입력해주세요.',
    },

    field: {
      email: '이메일',
      password: '비밀번호',
    },

    visibility: {
      label: '빙고 공개 범위',
      public: '전체 공개',
      public_des: '빙고를 누구에게나 공개해요.',
      friends: '친구 공개',
      friends_des: '빙고를 친구들에게만 공개해요.',
      private: '비공개',
      private_des: '빙고를 나만 봐요.',
    },

    // Actions
    confirm: '확인',
    cancel: '취소',
    delete: '삭제',
    next: '다음',
    previous: '이전',
    start: '시작하기',
    select: '선택',

    retry: '다시 시도',

    // Navigation / UI
    more: '더보기',
    save: '저장하기',
    unsaved: {
      title: '저장하지 않은 변경사항이 있어요',
      body: '지금 나가면 변경 사항이 저장되지 않아요.',
      cancel: '계속 수정',
      confirm: '나가기',
    },
    // States
    noSearchResult: '검색 결과가 없어요.',
    offline: '오프라인이에요 · 연결되면 자동으로 새로고침돼요',

    error: {
      save: '저장하지 못햇어요.',
      general: '오류가 발생했어요.',
      retry: '잠시 후 다시 시도해주세요.',
      unknown: '알 수 없는 오류가 발생했어요.',
      network: '네트워크 오류가 발생했어요.',
    },

    // 빙고 상태 라벨
    stateDraft: '제작 중',
    stateProgress: '진행 중',
    stateDone: '완료',

    permission: {
      cameraTitle: '카메라 권한이 필요해요.',
      cameraBody: '설정에서 카메라 접근을 허용해주세요.',
      albumTitle: '앨범 권한이 필요해요.',
      albumnBody: '설정에서 사진 접근을 허용해주세요.',
    },

    limitPlaceholder: '{{count}}}자 이내로 입력해주세요.',
  },

  onboarding: {
    msg1: '이루기 어려웠던 목표를\n빙고판에 채워봐요',
    msg2: '혼자서 의지가 안 생긴다면\n친구와 가족과 함께해요',
    msg3: '사람들과 목표를 공유하고\n서로의 도전을 응원해요',
    msg4: '차근차근 목표를 이뤄나가며\n뱃지를 수집해요',
    msg5: '빙고에 채우는 나만의 도전,\n빙킷에서 시작해봐요',
  },

  auth: {
    apple: 'Apple',
    google: 'Google',
    kakao: '카카오',
    email: '이메일',

    startWith: {
      apple: 'Apple로 시작하기',
      google: 'Google로 시작하기',
      email: '이메일로 시작하기',
      kakao: '카카오로 시작하기',
    },

    field: {
      email: '이메일',
      password: '비밀번호',
      passwordConfirm: '비밀번호 확인',
    },

    placeholder: {
      email: '이메일을 입력해주세요.',
      password: '8자 이상 영문, 숫자, 특수문자를 포함해주세요.',
      passwordConfirm: '비밀번호 확인을 입력해주세요.',
    },

    validation: {
      invalidEmail: '올바른 이메일 형식을 입력해주세요.',
      invalidPassword: '비밀번호는 8자 이상이어야 해요.',
      missingPassword: '비밀번호를 입력해주세요.',
      missingPasswordConfirm: '비밀번호 확인을 입력해주세요.',
      passwordMismatch: '비밀번호가 일치하지 않아요.',
      alreadyRegistered: '이미 가입된 이메일이에요.',
    },

    login: {
      failed: '로그인에 실패했어요.',
      required: '로그인이 필요해요.',
    },

    agreement: {
      title: '서비스 이용 필수 동의',
      all: '전체 동의',
      term: '이용 약관 동의',
      privacy: '개인정보 수집 및 이용 동의',
      over14: '만 14세 이상입니다.',
    },

    continue: '계속하기',
  },

  bingo: {
    achievedDate: '달성일',
    stat: {
      achievement: '달성',
      bingo: '빙고',
      endDate: '종료일',
    },

    cellGrid: {
      label: '빙고 칸 수',
      hint: '저장 후 변경 불가',
      description: '대각선 3칸도 빙고로 인정돼요.',
    },

    modifyCount: {
      label: '각 항목 수정 가능 횟수',
      none: '수정 불가',
      count: '{{count}}회',
      infinite: '무제한',
      hint: '저장 후 변경 불가',
    },

    cell: {
      label: '빙고 내용 작성',
      hint: '각 칸을 선택해서 빙고 내용을 채워주세요.',
    },

    error: {
      bingoSave: '빙고판을 저장하지 못했어요.',
    },
  },

  invite: {
    error: {
      missing: '초대를 찾을 수 없어요.',
      expired: '수락하지 못했어요.',
      deny: '거절하지 못했어요.',
    },
  },

  home: {
    empty: '빙고가 하나도 없어요\n첫 빙고를 만들어 볼까요?',
    // 빙고 추가 부분
    addBingo: {
      default: '빙고 추가하기',
      friends: '친구와 할래요',
      myself: '혼자 할래요',
      clean: '빙고를 먼저 정리해주세요.',
      clean_des: '빙고는 한 번에 {{count}}개까지 진행할 수 있어요. ',
    },

    // invite: '초대',
    memo: '메모',
    modifyBingo: '빙고 수정하기',

    btnLabel: {
      temporarySave: '임시저장',
      add: '추가하기',
      modify: '수정하기',

      creating: '만드는 중...',
      processing: '처리 중...',
      startBingoWith: '함께 빙고 시작하기',
    },

    field: {
      title: {
        word: '제목',
        label: '제목을 입력해주세요.',
      },

      duration: {
        label: '목표 기간을 선택해주세요.',
        oneMonth: '1개월',
        threeMonths: '3개월',
        sixMonths: '6개월',
        oneYear: '1년',
        custom: '직접 지정',
        startDate: '시작일',
        endDate: '종료일',
        selectStartDate: '시작일을 선택해주세요.',
        selectEndDate: '종료일을 선택해주세요.',
      },

      selectTheme: '테마 선택',
      modifyCount: {
        label: '빙고 수정 가능 횟수',
        infinite: '무제한',
      },

      bet: {
        label: '내기 내용',
      },

      friend: {
        label: '친구 선택하기',
        invite: '초대할 친구',
        description: '친구는 최대 {{count}}명까지 같이할 수 있어요.',
      },
    },
    alert: {
      fillAllCells: '빙고 칸을 모두 채워주세요.',
      selectFriends: '함께할 친구를 한 명 이상 선택해주세요.',
    },

    error: {
      save: '저장에 실패했어요.',
      delete: '삭제에 실패했어요..',
      load: '빙고를 불러오지 못했어요',
      loadInvite: '초대를 불러오지 못했어요.',
      reject: '거절에 실패했어요.',
      teamStatus: '팀 정보를 불러올 수 없어요.',
      teamInfoLoad: '팀 정보를 불러오지 못했어요.',
    },

    // 문장
    temporarySaved: '임시 저장되었어요.\n홈 화면에서 이어서 만들 수 있어요.',
    deleteConfirm: '빙고를 정말로 삭제할까요?',
    deleteBody: '삭제된 빙고는 되돌릴 수 없어요.',

    // 팀 초대
    inviteCompetitionMessage: '{{name}}님이 빙고로 경쟁하고 싶어해요',
    inviteTogetherMessage: '{{name}}님이 빙고를 함께하고 싶어해요',
    period: '진행 기간: {{startDate}} ~ {{endDate}}',
    daysUntilEnd: '종료일까지 {{days}}일 남았어요',
    daysUntilStart: '{{days}}일 후 다 같이 시작해요',
    currentMemberCount: '지금 {{count}}명이 참여 중이에요',
    composingDescription: '기간은 초대한 사람이 정한 그대로예요. 목표만 자유롭게 정하면 돼요.',
    rejectInvite: '거절하기',
    rejectInviteTitle: '초대를 거절할까요?',
    rejectInviteBody: '거절하면 이 팀 빙고에 참여할 수 없어요.',

    // 저장 확인 모달
    modal: {
      save: {
        title: '빙고 만들기',
        body: '목표 기간, 칸 개수, 수정 가능 횟수는\n저장 후에는 수정할 수 없어요.\n이대로 빙고를 만들까요?',
        cancel: '한 번 더 보기',
        confirm: '빙고 만들기',
      },
      friend: {
        title: '기간과 칸 내용은 만든 뒤에 바꿀 수 없어요.\n친구 {{count}}명에게 초대를 보낼까요?',
        cancel: '한 번 더 보기',
        confirm: '초대 보내기',
      },
      leaveTeam: {
        title: '팀에서 나갈까요?',
        body_share: '내가 채운 칸은 그대로 남아요. 방장이라면 다음 사람에게 넘어가요.',
        body_solo: '내 빙고는 개인 빙고로 남아요. 팀 순위에서만 빠져요.',
        fail: '팀 나가기에 실패했어요.',
      },
    },
    saveConfirmTitle: '빙고 만들기',
    saveConfirmCancel: '한 번 더 보기',
    okAndCreate: '수락하고 빙고 만들기',
    doWith: '같이하기',

    // 팀 현황 화면 (TeamStatusScreen)
    pendingAccept: '수락 대기',
    leaveTeamMenuItem: '팀 나가기',

    teamStartCountdown: '{{days}}일 후 다 같이 시작해요. 그때부터 칸을 채울 수 있어요.',
    teamEndedShared: '우리 팀은 {{total}}칸 중 {{checked}}칸을 채웠어요 👏',
    teamEndedNoWinner: '팀 빙고가 끝났어요 👏',
    teamWinner: '{{names}}님이 1등이에요! 👑',
    participants: '참여자',
    boardNotCreated: '아직 빙고판을\n만들지 않았어요',
    boardLoadFailRefresh: '빙고판을 불러오지 못했어요\n당겨서 새로고침해주세요',
    noJoinedMembers: '아직 참여한 사람이 없어요\n초대를 수락하면 여기에 보여요',
    retrospectiveTitle: '회고',
    retrospectiveDescription: '이 기간이 나에게 어땠는지 남겨보세요. 팀원들도 볼 수 있어요.',
    retrospectivePlaceholder: '회고를 남겨보세요.',
    retrospectiveSaveFail: '회고를 저장하지 못했어요. 잠시 후 다시 시도해주세요.',
    noOtherRetrospective: '아직 다른 사람의 회고가 없어요',
    sharedModeInfo: '먼저 누른 사람이 그 칸의 주인이 돼요. 채운 칸은 그 사람만 해제할 수 있어요.',
    rankFrozenInfo: '순위는 종료 시점 달성률로 확정됐어요.',
    rankInfo: '순위는 달성률(채운 칸 ÷ 전체 칸)로 정해져요. 판 크기가 달라도 공평해요.',

    periodEnded: '종료',
    periodDaysUntilStart: '{{days}}일 후 시작',
    periodDday: 'D-{{days}}',
  },

  board: {
    author: '작성자',
    anonymous: '익명',
    submit: '등록',
    badWord: '올바르지 않은 표현을 사용했어요.',

    post: {
      empty: '아직 게시글이 없어요\n첫 글을 남겨보세요',
      create: {
        title: '게시글 작성하기',
        error: '게시글 작성에 실패했어요.',
      },

      edit: {
        menu: '수정하기',
        title: '게시글 수정하기',
        error: '게시글 수정에 실패했어요.',
      },

      delete: {
        menu: '삭제하기',
        title: '게시글을 삭제할까요?',
        body: '삭제된 게시글은 복구할 수 없어요.',
        error: '게시글 삭제에 실패했어요.',
      },

      form: {
        contentPlaceholder: '내용을 입력해주세요.',
      },

      attachment: {
        loadBingo: '빙고 불러오기',
        takePhoto: '카메라로 촬영하기',
        pickFromAlbum: '앨범에서 선택하기',
      },

      bingo: {
        empty: '빙고가 없어요.',
        create: '빙고 만들기',
        loadError: '빙고 목록을 불러오지 못했어요.',
      },

      error: {
        notFound: '게시글을 찾을 수 없어요.',
        like: '좋아요를 반영하지 못했어요. 잠시 후 다시 시도해주세요.',
      },
    },

    comment: {
      first: '첫 댓글을 남겨주세요.',
      placeholder: '댓글을 입력해주세요.',
      warning: '부적절한 내용은 제재를 받을 수 있어요.',
      writingTo: '{{author}}에게 댓글 작성 중',
      more: '댓글 더보기',

      delete: {
        title: '댓글을 삭제할까요?',
        deleted: '삭제된 댓글이에요.',
      },

      error: {
        load: '댓글을 불러오지 못했어요.',
        create: '댓글 작성에 실패했어요.',
        delete: '댓글 삭제에 실패했어요.',
      },
    },

    moderation: {
      report: {
        menu: '신고하기',
        explanation: '누적 신고 횟수가 3회 이상인 유저는 커뮤니티 이용 제한이 있을 수 있어요.',
        confirm: '신고하기',

        reason: {
          ad: '상업적 광고 및 판매',
          abuse: '욕설/비하',
          sexual: '음란물/성적인 내용',
          spam: '도배',
          impersonation: '사칭/사기',
          other: '기타',
        },

        success: {
          title: '신고 완료',
          body: '신고 내용은 24시간 이내에 조치돼요.',
        },

        error: '신고에 실패했어요.',
      },

      block: {
        menu: '차단하기',
        body: '이 사용자를 차단하시겠어요?\n차단된 사용자의 게시글과 댓글이 보이지 않아요.',
        confirm: '차단하기',

        success: {
          title: '해당 사용자를 차단했어요.',
          body: '이제 이 사용자가 작성한 게시글과 댓글이 보이지 않아요.',
        },

        error: '차단에 실패했어요.',
      },
    },

    search: {
      placeholder: '제목 · 본문 · 댓글 검색',
      recent: '최근 검색어',
      deleteAll: '전체 삭제',
      empty: '최근 검색어가 없어요.',
      error: '검색하지 못했어요.',
    },
  },

  notifications: {
    setAllRead: '모두 읽음 처리',
    empty: '새로운 알림이 없어요.',
    more: '알림 더보기',

    title: {
      default: '새 알림',
      bingoReminder: '마감이 얼마 남지 않았어요',
      bingoDday: '마감이 내일이에요',
      teamInvite: '빙고 초대가 왔어요',
      teamFinished: '빙고가 종료되었어요',
      comment: '게시글에 새로운 댓글이 달렸어요',
      reply: '게시글에 새로운 댓글이 달렸어요',
      like: '게시글에 좋아요가 달렸어요',
      friendRequest: '친구 요청이 왔어요',
      teamJoined: '팀에 새로 합류했어요',
      teamInviteDeclined: '함께하기를 거절했어요',
      teamCellChecked: '팀원이 칸을 채웠어요',
      badge: '새 뱃지를 획득했어요',
      popular: '인기글이 되었어요',
    },

    time: {
      justNow: '방금 전',
      minutesAgo: '{{count}}분 전',
      hoursAgo: '{{count}}시간 전',
      daysAgo: '{{count}}일 전',
    },

    action: {
      confirm: '수락하기',
      confirm_short: '수락',
      deny: '거절하기',
      deny_short: '거절',
      checkInvite: '초대 확인하기',
      checkTeamStatus: '팀 현황 보기',
    },

    error: '알림을 불러오지 못했어요.',
  },

  my: {
    feed: '피드',
    badge: '뱃지',

    post: {
      title: '게시글',
      empty: '아직 작성한 글이 없어요.',
      emptyBtn: '게시판 둘러보기',
    },
  },

  profile: {
    visible: {
      friend: '친구만 볼 수 있어요.',
      friend_des: '친구가 되면 빙고와 뱃지를 볼 수 있어요.',
      locked: '비공개 계정이에요.',
      locked_des: '이 계정은 빙고와 뱃지를 공개하지 않아요.',
    },

    beFriend: {
      require: '친구 신청',
      required: '친구 요청 보냄',
    },

    error: {
      loadProfile: '프로필을 불러오지 못햇어요.',
      friendRequire: '친구 요청에 실패했어요.',
      notFound: '찾을 수 없는 사용자예요.',
    },
  },

  settings: {
    label: '설정',
    profile: {
      label: '프로필 편집',

      image: {
        label: '프로필 사진',
        camera: '카메라',
        album: '앨범에서 선택',
        default: '기본 이미지 적용',
      },

      nickname: {
        label: '닉네임',
        placeholder: '{{count}}자 이내로 입력해주세요.',
        mixture: '한글/영어/숫자 조합으로만 입력할 수 있어요.',
        error: '닉네임을 입력해주세요.',
      },

      id: {
        label: '아이디',
        placeholder: '영어, 언더바, 하이픈, 숫자로만 {{count}}자 이내로 입력해주세요.',
        mixture: '영어/숫자/_ - 조합으로만 입력할 수 있어요.',
        error: '아이디를 입력해주세요.',
      },
      bio: {
        label: '한 줄 다짐',
        edit: '한 줄 다짐 편집',
        placeholder: '{{count}}자 이내로 입력해주세요.',
      },
    },

    account: {
      label: '계정 관리',
      linkedInfo: '연동 계정 정보',
      linkedInfoFail: '연동 계정을 불러오지 못했어요',
      linkedInfoEmpty: '연동된 계정이 없어요',

      visibility: '계정 공개 범위',
      public: '전체 공개',
      public_des: '내가 작성한 빙고를 누구나 볼 수 있고, 계정도 검색돼요.',
      friends: '친구 공개',
      friends_des: '내가 작성한 빙고를 친구만 볼 수 있어요. 계정은 검색돼요.',
      private: '비공개',
      private_des: '내가 작성한 빙고를 나만 볼 수 있고, 계정도 검색되지 않아요.',
      visibilityChangeFail: '공개 범위를 바꾸지 못했어요.',

      reset: {
        label: '빙고 초기화',
        title: '정말로 빙고를 초기화 하시겠어요?',
        body: '• 작성한 모든 빙고가 삭제돼요.\n• 글과 댓글은 남아요.\n• 계정과 프로필은 유지돼요.',
        confirm: '초기화 하기',
        doneTitle: '초기화 완료',
        doneBody: '모든 빙고가 삭제되었어요.',
      },

      withdraw: {
        label: '회원 탈퇴',
        title: '정말로 탈퇴를 하시겠어요?',
        body: '• 계정과 프로필 정보, 프로필 사진이 삭제돼요.\n• 계정 삭제 후 데이터 복구가 불가능해요.\n• 작성한 글과 댓글은 첨부한 사진과 함께 (알 수 없음)으로 남아요',
        confirm: '탈퇴하기',
      },
    },

    notifications: {
      label: '알림 설정',

      blockTitle: '기기 알림이 꺼져 있어요.',
      blockBody:
        '아래 설정과 무관하게 알림이 오지 않아요. 기기 설정에서 앱 푸시 알림을 켜주세요. >',

      bingo: {
        label: '빙고',
        deadline: '기간 임박 알림',
      },
      team: {
        label: '팀 빙고',
        teamAction: '팀원 활동 알림',
      },
      board: {
        label: '게시판',
        comment: '댓글 알림',
        like: '좋아요 알림',
      },

      error: {
        save: '알림 설정 저장에 실패했어요.',
        load: '알림 설정을 불러오지 못했어요. 화면의 값이 실제와 다를 수 있어요.',
      },
    },
    theme: {
      label: '앱 테마',
      system: '시스템',
      light: '라이트',
      dark: '다크',

      icon: {
        label: '아이콘 테마',
        default: '기본',
        neon: '네온',
        sunset: '노을',
        tanning: '태닝',
      },
    },

    review: '앱 리뷰 남기기',
    faq: '자주 묻는 질문',
    terms: '이용 약관',
    privacyPolicy: '개인정보 처리방침',
    updateHistory: '업데이트 내역',
    quickInquiry: {
      label: '빠른 문의',
      title: '문의/신고하기',
      confirm: '제출하기',
      placeholder: '문의/신고하실 내용을 입력하세요.',
      successTitle: '문의가 접수되었습니다',
      successBody: '빠른 시간 내에 검토 후 조치하겠습니다.',
      error: '문의 접수에 실패했어요. 다시 시도해주세요.',
    },
    developerEmail: '개발자 이메일',
    emailCopied: '이메일을 복사했어요.',
    versionInfo: '버전 정보',
    logout: {
      label: '로그아웃',
      title: '로그아웃 하시겠어요?',
    },
  },

  friends: {
    label: '친구',
    allUsers: '전체 유저',
    delete: '친구 삭제',

    noFriend: '아직 친구가 없어요. 친구를 먼저 추가해 주세요.',
    deleteConfirm: '{{displayName}}님을 친구 목록에서 삭제할까요?',
    searchPlaceholder: '닉네임이나 아이디를 검색해주세요.',
    inviteMessage: '아직 앱을 사용하지 않는 친구가 있나요?\n친구를 초대해서 함께해요.',

    team: {
      select: '친구 선택',
      complete: '완료',
      selectFriend: '함께할 친구를 골라주세요. 고른 사람이 여기에 보여요.',
    },

    invite: {
      label: '초대하기',
      title: '빙킷에서 친구와 목표를 함께 이뤄봐요!',
      description: '빙고 형태로 목표를 세우고 커뮤니티에서 함께 달성해보세요.',
      openApp: '앱에서 열기',
    },

    error: {
      load: '친구 목록을 불러오지 못했어요.',
      invite: '초대 링크 공유에 실패했어요.',
      request: '친구 요청에 실패했어요.',
      search: '검색에 실패했어요.',
      delete: '친구 삭제에 실패했어요.',
    },
  },

  team: {
    mode: {
      shared: {
        label: '함께하기',
        description: '하나의 빙고판을 같이 채워요.',
        guide:
          '빙고판 하나를 작성해서 친구들과 함께 완성해요.\n칸 내용과 테마는 방장인 나만 수정할 수 있어요.',
      },

      competition: {
        label: '경쟁하기',
        description: '각자 빙고를 작성하고 경쟁해요.',
        guide: '각자 빙고판을 작성해서 경쟁해요.\n초대를 보내면 친구들도 각자 빙고를 작성해요.',
      },

      copied: {
        label: '같은 목표로',
        description: '같은 목표로 시작해 각자 자기 판을 채워요.',
        guide: '같은 목표로 시작해 각자 자기 판을 채워요.',
      },
    },
  },

  update: {
    title: '업데이트가 필요해요.',
    description: '새 버전으로 업데이트해야\n계속 사용할 수 있어요',
    button: '업데이트하러 가기',
  },
  badge: {
    cell_1: {
      name: '첫 발걸음',
      message: '빙고 칸 10개를 달성했어요! 🎉',
    },
    cell_2: {
      name: '꾸준한 도전',
      message: '빙고 칸 30개를 달성했어요! 🎉',
    },
    cell_3: {
      name: '목표 달성자',
      message: '빙고 칸 50개를 달성했어요! 🎉',
    },
    cell_4: {
      name: '빙고 마스터',
      message: '빙고 칸 100개를 달성했어요! 🏆',
    },

    like_1: {
      name: '첫 좋아요',
      message: '첫 좋아요를 눌렀어요! 💙',
    },
    like_2: {
      name: '좋아요둥이',
      message: '좋아요 10개를 눌렀어요! 💙',
    },
    like_3: {
      name: '좋아요 부스트',
      message: '좋아요 50개를 눌렀어요! ❤️',
    },
    like_4: {
      name: '좋아요 대마왕',
      message: '좋아요 100개를 눌렀어요! ❤️',
    },

    comment_1: {
      name: '첫 댓글',
      message: '첫 댓글을 작성했어요! 💬',
    },
    comment_2: {
      name: '이야기꾼',
      message: '댓글 30개를 작성했어요! 💬',
    },
    comment_3: {
      name: '소통왕',
      message: '댓글 50개를 작성했어요! 👑',
    },
    comment_4: {
      name: '댓글 마스터',
      message: '댓글 100개를 작성했어요! 👑',
    },

    post_1: {
      name: '첫 게시글',
      message: '첫 게시글을 작성했어요! 📝',
    },
    post_2: {
      name: '활발한 활동가',
      message: '게시글 30개를 작성했어요! 📝',
    },
    post_3: {
      name: '커뮤니티 스타',
      message: '게시글 50개를 작성했어요! ⭐',
    },
    post_4: {
      name: '전설의 작가',
      message: '게시글 80개를 작성했어요! 🏆',
    },

    notification: '🏅 새 뱃지 획득! {{name}} - {{message}}',
  },
};
