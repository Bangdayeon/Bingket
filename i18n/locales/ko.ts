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
      endDate: '종료일',
      emptyBingo: '볼 수 없는 빙고예요.',
      memoPlaceholder: '메모를 입력해주세요.',
    },

    field: {
      email: '이메일',
      password: '비밀번호',
    },

    // Actions
    confirm: '확인',
    cancel: '취소',
    delete: '삭제',
    next: '다음',
    previous: '이전',
    start: '시작하기',

    retry: '다시 시도',

    // Navigation / UI
    more: '더보기',

    // States
    noSearchResult: '검색 결과가 없어요.',
    offline: '오프라인이에요 · 연결되면 자동으로 새로고침돼요',

    error: {
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
      cameraTitle: '카메라 권한 필요',
      cameraBody: '설정에서 카메라 접근을 허용해주세요.',
      albumTitle: '앨범 권한 필요',
      albumnBody: '설정에서 사진 접근을 허용해주세요.',
    },
  },

  onboarding: {
    msg1: '이루기 어려웠던 목표를\n빙고판에 채워봐요',
    msg2: '혼자서 의지가 안 생긴다면\n친구와 가족과 함께해요',
    msg3: '사람들과 목표를 공유하고\n서로의 도전을 응원해요',
    msg4: '차근차근 목표를 이뤄나가며\n뱃지를 수집해요',
    msg5: '빙고에 채우는 나만의 도전,\n빙킷에서 시작해봐요',
  },

  auth: {
    email: '이메일',
    password: '비밀번호',
    emailPlaceholder: '이메일을 입력해주세요.',
    passwordPlaceholder: '8자 이상 영문, 숫자, 특수문자를 포함해주세요.',
    invalidEmail: '올바른 이메일 형식을 입력해주세요.',
    continue: '계속하기',

    login: {
      emailStart: '이메일로 시작하기',
      missingPassword: '비밀번호를 입력해주세요.',
      loginFailed: '로그인에 실패했어요.',
      needLogin: '로그인이 필요해요.',
    },

    signup: {
      passwordConfirm: '비밀번호 확인',
      passwordConfirmPlaceholder: '비밀번호 확인',
      invalidPassword: '비밀번호는 8자 이상이어야 해요.',
      invalidPasswordConfirm: '비밀번호가 일치하지 않아요.',
      missingPassword: '비밀번호를 입력해주세요.',
      missingPasswordConfirm: '비밀번호 확인을 입력해주세요.',
      alreadyRegistered: '이미 가입된 이메일이에요.',
    },
  },

  home: {
    addBingo: '빙고 추가하기',
    invite: '초대',
    memo: '메모',
    modifyBingo: '빙고 수정하기',

    btnLabel: {
      temporarySave: '임시저장',
      save: '저장하기',
      add: '추가하기',
      modify: '수정하기',

      creating: '만드는 중...',
      processing: '처리 중...',
      startBingoWith: '함께 빙고 시작하기',
    },

    field: {
      title: {
        label: '제목을 입력해주세요.',
      },

      duration: {
        label: '목표 기간을 선택해주세요.',
        oneMonth: '1개월',
        threeMonths: '3개월',
        sixMonths: '6개월',
        oneYear: '1년',
        custom: '직접 지정',
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
    empty: '아직 버킷리스트가 없어요.',

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
      unsaved: {
        title: '저장하지 않은 변경사항이 있어요',
        body: '지금 나가면 변경 사항이 저장되지 않아요.',
        cancel: '계속 수정',
        confirm: '나가기',
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

  community: {
    postAuthor: '작성자',
    comment: '댓글',

    // 문장
    reportExplanation: '누적 신고 횟수가 3회 이상인 유저는 커뮤니티 이용 제한이 있을 수 있어요.',
    firstComment: '첫 댓글을 남겨주세요.',
    commentWarning: '부적절한 내용은 제재를 받을 수 있어요.',

    // 게시글/댓글 상세 화면
    postNotFound: '게시글을 찾을 수 없어요.',
    postDeleteFailTitle: '삭제 실패',
    postDeleteFail: '게시글 삭제에 실패했어요.',
    commentAddFail: '댓글 작성에 실패했어요.',
    commentDeleteFail: '댓글 삭제에 실패했어요.',
    reportFail: '신고에 실패했어요.',
    blockFail: '차단에 실패했어요.',

    // 메뉴 라벨
    editPost: '수정하기',
    deletePost: '삭제하기',
    report: '신고하기',
    blockUser: '차단하기',
    block: '차단',

    // 신고 사유
    reportReasonAd: '상업적 광고 및 판매',
    reportReasonAbuse: '욕설/비하',
    reportReasonSexual: '음란물/성적인 내용',
    reportReasonSpam: '도배',
    reportReasonImpersonation: '사칭/사기',
    reportReasonOther: '기타',

    // 신고 완료
    reportSuccessTitle: '신고 완료',
    reportSuccessBody: '신고 내용은 24시간 이내에 조치돼요.',

    // 게시글 삭제 확인
    deletePostConfirmTitle: '게시글을 삭제할까요?',
    deletePostConfirmBody: '삭제된 게시글은 복구할 수 없어요.',

    // 댓글 삭제 확인
    deleteCommentTitle: '댓글 삭제',
    deleteCommentBody: '댓글을 삭제할까요?',

    // 차단 확인/완료
    blockUserConfirmBody:
      '이 사용자를 차단하시겠어요?\n차단된 사용자의 게시글과 댓글이 보이지 않아요.',
    blockSuccessTitle: '차단 완료',
    blockSuccessBody: '해당 사용자를 차단했어요.',

    // 토스트
    badWordToast: '올바르지 않은 표현을 사용했어요',

    // 검색 화면
    searchFailed: '검색하지 못했어요',
    recentSearches: '최근 검색어',
    deleteAll: '전체 삭제',
    noRecentSearches: '최근 검색어가 없어요.',

    // 작성/수정 화면
    editPostTitle: '게시글 수정하기',
    writePostTitle: '게시글 작성하기',
    submit: '등록',
    contentPlaceholder: '내용을 입력해주세요.',
    editPostFail: '게시글 수정에 실패했어요.',
    createPostFail: '게시글 작성에 실패했어요.',
    loadBingo: '빙고 불러오기',
    anonymous: '익명',
    takePhoto: '카메라로 촬영하기',
    pickFromAlbum: '앨범에서 선택하기',
    myBingosLoadFail: '빙고 목록을 불러오지 못했어요',
    noBingos: '빙고가 없어요.',
  },

  notifications: {
    setAllRead: '모두 읽음 처리',
    noNew: '새로운 알림이 없어요',
    more: '알림 더보기',
    error: '알림을 불러오지 못했어요.',
  },

  my: {
    feed: '피드',
    badge: '뱃지',

    // 계정 관리 화면
    kakaoLabel: '카카오톡',
    linkedAccountsTitle: '연동 계정 정보',
    linkedAccountsLoadFail: '연동 계정을 불러오지 못했어요',
    noLinkedAccounts: '연동된 계정이 없어요',
    accountVisibilityTitle: '계정 공개 범위',
    resetBingos: '빙고 초기화',
    withdraw: '회원 탈퇴',

    // 빙고 초기화 확인/완료
    resetConfirmTitle: '정말로 빙고를 초기화 하시겠어요?',
    resetConfirmBody:
      '• 작성한 모든 빙고가 삭제돼요.\n• 글과 댓글은 남아요.\n• 계정과 프로필은 유지돼요.',
    resetConfirmButton: '초기화 하기',
    resetDoneTitle: '초기화 완료',
    resetDoneBody: '모든 빙고가 삭제되었어요.',

    // 회원 탈퇴 확인
    withdrawConfirmTitle: '정말로 탈퇴를 하시겠어요?',
    withdrawConfirmBody:
      '• 계정과 프로필 정보, 프로필 사진이 삭제돼요.\n• 계정 삭제 후 데이터 복구가 불가능해요.\n• 작성한 글과 댓글은 첨부한 사진과 함께 (알 수 없음)으로 남아요',
    withdrawButton: '탈퇴하기',

    visibilityChangeFail: '공개 범위를 바꾸지 못했어요. 잠시 후 다시 시도해주세요.',
  },

  settings: {
    profileEdit: '프로필 편집',
    accountManagement: '계정 관리',
    notificationSettings: '알림 설정',
    appTheme: '앱 테마',
    writeReview: '앱 리뷰 남기기',
    faq: '자주 묻는 질문',
    terms: '이용 약관',
    privacyPolicy: '개인정보 처리방침',
    updateHistory: '업데이트 내역',
    quickInquiry: '빠른 문의',
    developerEmail: '개발자 이메일',
    versionInfo: '버전 정보',
    logout: '로그아웃',
    logoutConfirm: '로그아웃 하시겠어요?',
    inquiryReport: '문의/신고하기',
    submit: '제출',
    inquiryPlaceholder: '문의/신고하실 내용을 입력하세요.',
    emailCopied: '이메일을 복사했어요.',
    inquirySuccessTitle: '문의가 접수되었습니다',
    inquirySuccessBody: '빠른 시간 내에 검토 후 조치하겠습니다.',
    inquiryErrorBody: '문의 접수에 실패했어요. 다시 시도해주세요.',

    notification: {
      dedline: '기간 임박 알림',
      teamBingo: '팀 빙고',
      teamAction: '팀원 활동 알림',
      comment: '댓글 알림',
      like: '좋아요 알림',

      blockTitle: '기기 알림이 꺼져 있어요.',
      blockBody: '아래 설정과 무관하게 알림이 오지 않아요. 눌러서 기기 설정에서 켜주세요.',
      saveFail: '알림 설정 저장에 실패했어요.',
      loadError: '알림 설정을 불러오지 못했어요. 화면의 값이 실제와 다를 수 있어요.',
    },

    theme: {
      appTitle: '앱 테마',
      system: '시스템',
      light: '라이트',
      dark: '다크',

      iconTitle: '아이콘 테마',
      default: '기본',
      neon: '네온',
      sunset: '노을',
      taning: '태닝',
    },

    post: {
      title: '게시글',
      empty: '아직 작성한 글이 없어요.',
      emptyBtn: '게시판 둘러보기',
    },
  },

  friends: {
    noFriend: '아직 친구가 없어요. 친구를 먼저 추가해 주세요.',
    loadFailed: '친구 목록을 불러오지 못했어요.',
    delete: '친구 삭제',
    deleteConfirm: '{{displayName}}님을 친구 목록에서 삭제할까요?',
    searchPlaceholder: '검색어',
    select: '친구 선택',
    complete: '완료',
    selectFriend: '함께할 친구를 골라주세요. 고른 사람이 여기에 보여요.',
    inviteMessage: '아직 앱을 사용하지 않는 친구가 있나요?\n친구를 초대해서 함께해요.',
    invite: '초대하기',
    friend: '친구',
    allUsers: '전체 유저',
    requestFailed: '친구 요청에 실패했어요.',
    searchFailed: '검색에 실패했어요.',
    deleteFailed: '친구 삭제에 실패했어요.',
    processFailed: '처리에 실패했어요.',
    inviteFailed: '초대 링크 공유에 실패했어요.',
    inviteShareTitle: '빙킷에서 친구와 목표를 함께 이뤄봐요!',
    inviteShareDescription: '빙고 형태로 목표를 세우고 커뮤니티에서 함께 달성해보세요.',
    openApp: '앱에서 열기',
  },

  team: {
    deny: '거절',
    confirm: '수락',

    // 문장
    checkInvite: '초대 확인하기',
    checkTeamStauts: '팀 현황 보기',
    noInvite: '초대를 찾을 수 없어요.',
  },
};
