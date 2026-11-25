export default {
  postWritingNotice: {
    line1: '他の人に不快感や被害を与える内容はお控えください',
    line2: '誹謗中傷、暴言、虚偽の内容など、他の人に害を与える投稿はできません',
    line3: 'みんなが気持ちよくやり取りできるよう、思いやりのある投稿をお願いします',
    line4: '他の人の権利を侵害する内容や不快感を与える内容は、予告なく削除される場合があります',
  },
  common: {
    screen: {
      home: 'ホーム',
      board: '掲示板',
      bingos: 'ビンゴを見る',
      notifications: '通知',
      mypage: 'マイページ',
    },
    date: 'YYYY.MM.DD',

    bingo: {
      bingo: 'ビンゴ',
      achieve: '達成',
      achieveDate: '達成日',
      endDate: '終了日',
      emptyBingo: 'このビンゴは見られません。',
      memoPlaceholder: 'メモを入力してください。',
    },

    field: {
      email: 'メールアドレス',
      password: 'パスワード',
    },

    visibility: {
      label: 'ビンゴの公開範囲',
      public: '全体公開',
      public_des: 'ビンゴを誰にでも公開します',
      friends: '友だちに公開',
      friends_des: 'ビンゴを友だちにだけ公開します',
      private: '非公開',
      private_des: 'ビンゴを自分だけが見られます',
    },

    // Actions
    confirm: '確認',
    cancel: 'キャンセル',
    delete: '削除',
    next: '次へ',
    previous: '前へ',
    start: 'はじめる',
    select: '選択',

    retry: '再試行',
    editFail: '変更に失敗しました',

    // Navigation / UI
    more: 'もっと見る',
    save: '保存する',
    unsaved: {
      title: '保存されていない変更があります',
      body: '今離れると、変更内容は保存されません',
      cancel: '編集を続ける',
      confirm: '離れる',
    },
    // States
    noSearchResult: '検索結果がありません',
    offline: 'オフラインです · 接続されると自動的に更新されます',

    error: {
      imageUpload: '画像のアップロードに失敗しました',
      save: '保存できませんでした',
      general: 'エラーが発生しました',
      retry: 'しばらくしてからもう一度お試しください',
      unknown: '不明なエラーが発生しました',
      network: 'ネットワークエラーが発生しました',
    },

    // Bingo status labels
    stateDraft: '作成中',
    stateProgress: '進行中',
    stateDone: '完了',

    permission: {
      cameraTitle: 'カメラの許可が必要です',
      cameraBody: '設定でカメラへのアクセスを許可してください',
      albumTitle: 'アルバムの許可が必要です',
      albumBody: '設定で写真へのアクセスを許可してください',
    },

    limitPlaceholder: '{{count}}文字以内で入力してください',
  },

  onboarding: {
    msg1: '達成が難しかった目標を\nビンゴ盤に埋めていきましょう',
    msg2: '一人でやる気が出ないときは\n友だちや家族と一緒に',
    msg3: 'みんなと目標を共有して\nお互いの挑戦を応援しましょう',
    msg4: '一歩ずつ目標を達成して\nバッジを集めましょう',
    msg5: 'ビンゴに埋める自分だけの挑戦、\nビンケットで始めましょう',
  },

  auth: {
    apple: 'Apple',
    google: 'Google',
    kakao: 'Kakao',
    email: 'メールアドレス',

    needLogin: 'ログインが必要です',

    startWith: {
      apple: 'Appleで始める',
      google: 'Googleで始める',
      email: 'メールアドレスで始める',
      kakao: 'Kakaoで始める',
    },

    field: {
      email: 'メールアドレス',
      password: 'パスワード',
      passwordConfirm: 'パスワード（確認）',
    },

    placeholder: {
      email: 'メールアドレスを入力してください',
      password: '8文字以上で英字・数字・記号を含めてください',
      passwordConfirm: 'パスワード（確認）を入力してください',
    },

    validation: {
      invalidEmail: '正しいメールアドレスの形式で入力してください',
      invalidPassword: 'パスワードは8文字以上で入力してください',
      missingPassword: 'パスワードを入力してください',
      missingPasswordConfirm: 'パスワード（確認）を入力してください',
      passwordMismatch: 'パスワードが一致しません',
      alreadyRegistered: 'すでに登録されているメールアドレスです',
    },

    login: {
      failed: 'ログインに失敗しました',
      required: 'ログインが必要です',
    },

    agreement: {
      title: 'サービス利用の必須同意',
      all: 'すべてに同意',
      term: '利用規約に同意',
      privacy: '個人情報の収集・利用に同意',
      over14: '14歳以上です',
    },

    continue: '続ける',
  },

  bingo: {
    label: 'ビンゴ',
    board: 'ビンゴ盤',
    user: 'ビンゴユーザー',
    empty: 'このビンゴは見られません',
    visibility: {
      label: 'ビンゴの公開範囲',
      public: '全体公開',
      publicDescription: 'ビンゴを誰にでも公開します',
      friends: '友だちに公開',
      friendsDescription: 'ビンゴを友だちにだけ公開します',
      private: '非公開',
      privateDescription: 'ビンゴを自分だけが見られます',
    },

    doneDate: '完了日',
    achievedDate: '達成日',
    stat: {
      achievement: '達成',
      bingo: 'ビンゴ',
      endDate: '終了日',
    },

    cellGrid: {
      label: 'ビンゴのマス数',
      hint: '保存後は変更できません',
      description: '斜めの3マスもビンゴとして認められます',
    },

    modifyCount: {
      label: 'マスごとの修正回数',
      none: '修正不可',
      count: '{{count}}回',
      infinite: '無制限',
      hint: '保存後は変更できません',
    },

    cell: {
      label: 'ビンゴの内容を書く',
      hint: '各マスをタップしてビンゴの内容を入力してください',
      placeholder: '最大30文字まで入力できます',
    },

    error: {
      bingoSave: 'ビンゴ盤を保存できませんでした',
      create: 'ビンゴの作成に失敗しました',
    },

    competition: {
      alreadyTitle: 'すでに埋まっているマスです',
      alreadyBody: '一歩遅かったです！すでに他のチームメンバーが埋めたマスです',
      my: '自分が埋めました',
      nobody: '退会したメンバー',
      other: 'さんが埋めました',
    },

    memo: {
      placeholder: 'メモを入力してください',
      saved: '保存しました',
      saveFailed: '保存に失敗しました',
    },

    theme: {
      default: 'デフォルト',
      rabbit: 'うさぎ',
      redHorse: '赤い馬',
      squareCat: '四角いねこ',
      pig: 'ぶた',
      midnight: 'ミッドナイト',
    },
  },

  invite: {
    error: {
      missing: '招待が見つかりません。',
      expired: '承諾できませんでした。',
      deny: '辞退できませんでした。',
    },
  },

  home: {
    empty: 'ビンゴがまだありません\n最初のビンゴを作ってみませんか？',
    // Add bingo section
    addBingo: {
      default: 'ビンゴを追加',
      friends: '友だちとやる',
      myself: '一人でやる',
      clean: 'まずビンゴを整理してください',
      cleanDescription: 'ビンゴは同時に{{count}}個まで進行できます',
    },

    // invite: '招待',
    memo: 'メモ',
    memoEdit: 'メモを編集',
    memoPlaceholder: 'メモを入力してください',
    modifyBingo: 'ビンゴを編集',
    lastModify: '最終更新',

    btnLabel: {
      temporarySave: '下書き保存',
      add: '追加',
      creating: '作成中...',
      processing: '処理中...',
      startBingoWith: '招待を送る',
    },

    field: {
      title: {
        word: 'タイトル',
        label: 'タイトルを入力してください',
      },

      duration: {
        word: '目標期間',
        label: '目標期間を選択してください',
        oneMonth: '1か月',
        threeMonths: '3か月',
        sixMonths: '6か月',
        oneYear: '1年',
        custom: '自分で指定',
        startDate: '開始日',
        endDate: '終了日',
        selectStartDate: '開始日を選択してください',
        selectEndDate: '終了日を選択してください',
      },

      selectTheme: 'テーマ',
      modifyCount: {
        label: 'ビンゴの修正可能回数',
        infinite: '無制限',
      },

      bet: {
        label: '賭けの内容',
      },
      reward: {
        label: '達成リワード',
      },

      friend: {
        label: '友だちを選ぶ',
        selected: '{{count}}人選択中',
        invite: '招待する友だち',
        description: '友だちは最大{{count}}人まで一緒にできます。',
      },
    },
    alert: {
      fillAllCells: 'ビンゴのマスをすべて埋めてください',
      selectFriends: '一緒にやる友だちを1人以上選んでください',
    },

    error: {
      save: '保存に失敗しました',
      delete: '削除に失敗しました',
      load: 'ビンゴを読み込めませんでした',
      loadInvite: '招待を読み込めませんでした。',
      reject: '辞退に失敗しました。',
      teamStatus: 'チーム情報を読み込めません。',
      teamInfoLoad: 'チーム情報を読み込めませんでした。',
    },

    // Sentences
    temporarySaved: '下書きを保存しました\nホーム画面から続きを作れます',
    deleteConfirm: 'このビンゴを本当に削除しますか？',
    deleteBody: '削除したビンゴは元に戻せません',

    // Team invitations
    inviteCompetitionMessage: '{{name}}さんがビンゴで競いたいそうです',
    inviteTogetherMessage: '{{name}}さんがビンゴを一緒にやりたいそうです',
    period: '期間: {{startDate}} ~ {{endDate}}',
    daysUntilEnd: '終了日まであと{{days}}日です',
    daysUntilStart: '{{days}}日後にみんなで始めます',
    currentMemberCount: '現在{{count}}人が参加中です',
    composingDescription: '期間は招待した人が決めたとおりです。目標だけ自由に決めてください。',
    rejectInvite: '辞退する',
    rejectInviteTitle: '招待を辞退しますか？',
    rejectInviteBody: '辞退すると、このチームビンゴに参加できません。',

    // Save confirmation modal
    modal: {
      save: {
        title: 'ビンゴを作る',
        body: '目標期間、マス数、修正可能回数は\n保存後に変更できません\nこのままビンゴを作りますか？',
        cancel: 'もう一度見る',
        confirm: 'ビンゴを作る',
      },
      friend: {
        title: '期間とマスの内容は作成後に変更できません\n友だち{{count}}人に招待を送りますか？',
        cancel: 'もう一度見る',
        confirm: '招待を送る',
      },
      leaveTeam: {
        title: 'チームを抜けますか？',
        body_share: '自分が埋めたマスはそのまま残ります。ホストの場合は、次の人に引き継がれます。',
        body_solo: '自分のビンゴは個人ビンゴとして残ります。チームの順位からのみ外れます。',
        fail: 'チームからの退出に失敗しました。',
      },
    },
    saveConfirmTitle: 'ビンゴを作る',
    saveConfirmCancel: 'もう一度見る',
    okAndCreate: '承諾してビンゴを作る',
    doWith: '一緒にやる',

    // Team status screen (TeamStatusScreen)
    pendingAccept: '承諾待ち',
    leaveTeamMenuItem: 'チームを抜ける',

    teamStartCountdown: '{{days}}日後にみんなで始めます。そこからマスを埋められます。',
    teamEndedShared: '私たちのチームは{{total}}マス中{{checked}}マスを埋めました 👏',
    teamEndedNoWinner: 'チームビンゴが終了しました 👏',
    teamWinner: '{{names}}さんが1位です！ 👑',
    participants: '参加者',
    boardNotCreated: 'まだビンゴ盤を\n作っていません',
    boardLoadFailRefresh: 'ビンゴ盤を読み込めませんでした\n下に引っ張って更新してください',
    noBingo: 'ビンゴ盤が見つかりません。',
    noJoinedMembers: 'まだ参加した人がいません\n招待を承諾するとここに表示されます',
    retrospectiveTitle: '振り返り',
    retrospectiveDescription:
      'この期間がどうだったか残してみましょう。チームメンバーも見られます。',
    retrospectivePlaceholder: '振り返りを残してみましょう。',
    retrospectiveSaveFail:
      '振り返りを保存できませんでした。しばらくしてからもう一度お試しください。',
    noOtherRetrospective: 'まだ他の人の振り返りはありません',
    sharedModeInfo:
      '先にタップした人がそのマスの持ち主になります。埋めたマスはその人だけが解除できます。',
    rankFrozenInfo: '順位は終了時点の達成率で確定しました。',
    rankInfo: '順位は達成率（埋めたマス ÷ 全マス）で決まります。盤の大きさが違っても公平です。',

    periodEnded: '終了',
    periodDaysUntilStart: '{{days}}日後に開始',
    howmany: '{{count}}人',
    periodDday: 'D-{{days}}',
  },

  board: {
    author: '投稿者',
    anonymous: '匿名',
    unknown: '(不明)',
    submit: '投稿',
    badWord: '不適切な表現が使われています',

    timeAgo: {
      justNow: 'たった今',
      minutesAgo: '{{count}}分前',
      hoursAgo: '{{count}}時間前',
      daysAgo: '{{count}}日前',
      monthsAgo: '{{count}}か月前',
    },

    post: {
      empty: 'まだ投稿がありません\n最初の投稿をしてみましょう',
      create: {
        title: '投稿を作成',
        error: '投稿の作成に失敗しました',
      },

      edit: {
        menu: '編集',
        title: '投稿を編集',
        error: '投稿の編集に失敗しました',
      },

      delete: {
        menu: '削除する',
        title: '投稿を削除しますか？',
        body: '削除した投稿は復元できません',
        error: '投稿の削除に失敗しました',
      },

      form: {
        contentPlaceholder: '内容を入力してください',
      },

      attachment: {
        loadBingo: 'ビンゴを読み込む',
        takePhoto: 'カメラで撮影する',
        pickFromAlbum: 'アルバムから選ぶ',
      },

      bingo: {
        empty: 'ビンゴがありません',
        create: 'ビンゴを作る',
        loadError: 'ビンゴの一覧を読み込めませんでした',
      },

      error: {
        notFound: '投稿が見つかりません',
        like: 'いいねを反映できませんでした。しばらくしてからもう一度お試しください',
      },
    },

    comment: {
      first: '最初のコメントを残してください',
      placeholder: 'コメントを入力してください',
      warning: '不適切な内容は制裁を受ける場合があります',
      writingTo: '{{author}}さんへのコメントを作成中',
      more: 'コメントをもっと見る',

      delete: {
        title: 'コメントを削除しますか？',
        deleted: '削除されたコメントです',
        description: '削除したコメントは復元できません',
      },

      error: {
        load: 'コメントを読み込めませんでした',
        create: 'コメントの作成に失敗しました',
        delete: 'コメントの削除に失敗しました',
      },
    },

    moderation: {
      report: {
        menu: '通報する',
        explanation:
          '累積通報回数が3回以上のユーザーは、コミュニティの利用が制限される場合があります',
        confirm: '通報する',

        reason: {
          ad: '商業広告・販売',
          abuse: '暴言・誹謗',
          sexual: 'わいせつ物・性的な内容',
          spam: '連投・スパム',
          impersonation: 'なりすまし・詐欺',
          other: 'その他',
        },

        success: {
          title: '通報完了',
          body: '通報内容は24時間以内に対応します',
        },

        error: '通報に失敗しました',
      },

      block: {
        menu: 'ブロックする',
        body: 'このユーザーをブロックしますか？\nブロックしたユーザーの投稿やコメントは表示されなくなります',
        confirm: 'ブロックする',

        success: {
          title: 'このユーザーをブロックしました',
          body: 'このユーザーが書いた投稿やコメントは表示されなくなります',
        },

        error: 'ブロックに失敗しました',
      },
    },

    search: {
      placeholder: 'タイトル · 本文 · コメントを検索',
      recent: '最近の検索',
      deleteAll: 'すべて削除',
      empty: '最近の検索はありません',
      error: '検索できませんでした',
    },
  },

  notifications: {
    setAllRead: 'すべて既読にする',
    empty: '新しい通知はありません',
    more: '通知をもっと見る',

    title: {
      default: '新しい通知',
      bingoReminder: '締め切りが近づいています',
      bingoDday: '締め切りは明日です',
      teamInvite: 'ビンゴの招待が届きました',
      teamFinished: 'ビンゴが終了しました',
      comment: '投稿に新しいコメントがつきました',
      reply: '投稿に新しいコメントがつきました',
      like: '投稿にいいねがつきました',
      friendRequest: '友だちリクエストが届きました',
      teamJoined: 'チームに新しく加わりました',
      teamInviteDeclined: '一緒にやるのを辞退しました',
      teamCellChecked: 'チームメンバーがマスを埋めました',
      badge: '新しいバッジを獲得しました',
      popular: '人気の投稿になりました',
    },

    time: {
      justNow: 'たった今',
      minutesAgo: '{{count}}分前',
      hoursAgo: '{{count}}時間前',
      daysAgo: '{{count}}日前',
    },

    action: {
      confirm: '承諾する',
      confirm_short: '承諾',
      deny: '辞退する',
      deny_short: '辞退',
      checkInvite: '招待を確認',
      checkTeamStatus: 'チームの状況を見る',
    },

    error: '通知を読み込めませんでした',
  },

  my: {
    feed: 'フィード',
    badge: 'バッジ',

    post: {
      title: '投稿',
      empty: 'まだ書いた投稿がありません',
      emptyBtn: '掲示板を見てみる',
    },
  },

  profile: {
    feedEmpty: 'フィードが空です',
    visible: {
      friend: '友だちだけが見られます',
      friendDescription: '友だちになるとビンゴとバッジを見られます',
      locked: '非公開アカウントです',
      lockedDescription: 'このアカウントはビンゴとバッジを公開していません',
    },

    beFriend: {
      require: '友だち申請',
      required: '友だちリクエスト送信済み',
    },

    error: {
      loadProfile: 'プロフィールを読み込めませんでした',
      friendRequire: '友だちリクエストに失敗しました',
      notFound: '見つからないユーザーです',
    },
  },

  settings: {
    label: '設定',
    closeMenu: 'メニューを閉じる',
    profile: {
      label: 'プロフィール編集',

      image: {
        label: 'プロフィール写真',
        camera: 'カメラ',
        album: 'アルバムから選ぶ',
        default: 'デフォルト画像を適用',
      },

      nickname: {
        label: 'ニックネーム',
        placeholder: '{{count}}文字以内で入力してください',
        mixture: 'ハングル・英字・数字の組み合わせのみ入力できます',
        error: 'ニックネームを入力してください',
      },

      id: {
        label: 'ID',
        placeholder: '英字、アンダーバー、ハイフン、数字のみ、{{count}}文字以内で入力してください',
        mixture: '英字・数字・_ - の組み合わせのみ入力できます',
        error: 'IDを入力してください',
      },
      bio: {
        label: '一言の決意',
        edit: '一言の決意を編集',
        empty: 'まだ一言の決意がありません',
        placeholder: '{{count}}文字以内で入力してください',
      },
    },

    account: {
      label: 'アカウント管理',
      linkedInfo: '連携アカウント情報',
      linkedInfoFail: '連携アカウントを読み込めませんでした',
      linkedInfoEmpty: '連携しているアカウントがありません',

      visibility: 'アカウントの公開範囲',
      public: '全体公開',
      publicDescription: '自分が作成したビンゴを誰でも見られ、アカウントも検索されます',
      friends: '友だちに公開',
      friendsDescription: '自分が作成したビンゴを友だちだけが見られ、アカウントは検索されます',
      private: '非公開',
      privateDescription: '自分が作成したビンゴを自分だけが見られ、アカウントも検索されません',
      visibilityChangeFail: '公開範囲を変更できませんでした',

      reset: {
        label: 'ビンゴの初期化',
        title: '本当にビンゴを初期化しますか？',
        body: '• 作成したすべてのビンゴが削除されます\n• 投稿とコメントは残ります\n• アカウントとプロフィールは維持されます',
        confirm: '初期化する',
        doneTitle: '初期化完了',
        doneBody: 'すべてのビンゴを削除しました',
      },

      withdraw: {
        label: '退会',
        title: '本当に退会しますか？',
        body: '• アカウント、プロフィール情報、プロフィール写真が削除されます\n• アカウント削除後はデータを復元できません\n• 書いた投稿とコメントは、添付した写真とともに（不明）として残ります',
        confirm: '退会する',
      },
    },

    notifications: {
      label: '通知設定',

      blockTitle: '端末の通知がオフになっています',
      blockBody:
        '以下の設定に関係なく通知が届きません。端末の設定でアプリのプッシュ通知をオンにしてください。>',

      bingo: {
        label: 'ビンゴ',
        deadline: '期限間近の通知',
      },
      team: {
        label: 'チームビンゴ',
        teamAction: 'チームメンバーの活動通知',
      },
      board: {
        label: '掲示板',
        comment: 'コメント通知',
        like: 'いいね通知',
      },

      error: {
        save: '通知設定の保存に失敗しました',
        load: '通知設定を読み込めませんでした',
      },
    },

    theme: {
      label: 'アプリのテーマ',
      system: 'システム',
      light: 'ライト',
      dark: 'ダーク',

      icon: {
        label: 'アイコンのテーマ',
        default: 'デフォルト',
        neon: 'ネオン',
        sunset: '夕焼け',
        tanning: '日焼け',
      },
    },

    review: 'アプリのレビューを書く',
    faq: 'よくある質問',
    terms: '利用規約',
    privacyPolicy: 'プライバシーポリシー',
    updateHistory: 'アップデート履歴',
    quickInquiry: {
      label: 'クイックお問い合わせ',
      title: 'お問い合わせ・通報',
      confirm: '送信する',
      placeholder: 'お問い合わせ・通報の内容を入力してください',
      successTitle: 'お問い合わせを受け付けました',
      successBody: '確認のうえ、できるだけ早く対応いたします。',
      error: 'お問い合わせの受付に失敗しました。しばらくしてからもう一度お試しください',
    },
    developerEmail: '開発者のメールアドレス',
    emailCopied: 'メールアドレスをコピーしました',
    versionInfo: 'バージョン情報',
    logout: {
      label: 'ログアウト',
      title: 'ログアウトしますか？',
    },
  },

  friends: {
    label: '友だち',
    allUsers: 'すべてのユーザー',
    delete: '友だちを削除',
    recieved: '受け取った友だちリクエスト',
    reRequest: '再リクエスト',
    add: '友だち追加',

    requestModal: {
      title: '友だちリクエスト',
      body: '相手から友だちリクエストが届いています\n承諾しますか？',
    },

    noSameFriend: '一致する友だちがいません。名前やIDを確認してください',
    noFriend: 'まだ友だちがいません。まず友だちを追加してください',
    deleteConfirm: '{{displayName}}さんを友だちリストから削除しますか？',
    searchPlaceholder: 'ニックネームまたはIDで検索してください',
    inviteMessage: 'まだアプリを使っていない友だちはいますか？\n友だちを招待して一緒にやりましょう',

    team: {
      select: '友だちを選ぶ',
      complete: '完了',
      selectFriend: '一緒にやる友だちを選んでください。選んだ人がここに表示されます。',
    },

    invite: {
      label: '招待する',
      title: 'ビンケットで友だちと一緒に目標を達成しよう！',
      description: 'ビンゴ形式で目標を立てて、コミュニティで一緒に達成しましょう',
      openApp: 'アプリで開く',
    },

    error: {
      load: '友だちリストを読み込めませんでした',
      invite: '招待リンクの共有に失敗しました',
      request: '友だちリクエストに失敗しました',
      search: '検索に失敗しました',
      delete: '友だちの削除に失敗しました',
      usage: 'この端末では共有シートを使えません',
    },
  },

  team: {
    title: '友だちと一緒にやる',
    create: {
      friend: {
        label: '友だちを招待する',
        selected: '{{count}}人選択中',
        invite: '招待する友だち',
        description: '友だちは最大{{count}}人まで一緒にできます',
      },
    },
    selection: {
      select: '友だちを選ぶ',
      complete: '完了',
      selectFriend: '一緒にやる友だちを選んでください',
    },
    invite: {
      friendsBingo: '{{userName}}さんのビンゴ盤',
      competitionMessage: '{{name}}さんがビンゴで競いたいそうです',
      togetherMessage: '{{name}}さんがビンゴを一緒にやりたいそうです',
      period: '期間: {{startDate}} ~ {{endDate}}',
      daysUntilEnd: '終了日まであと{{days}}日です',
      daysUntilStart: '{{days}}日後にみんなで始めます',
      currentMemberCount: '現在{{count}}人が参加中です',
      composingDescription: '期間は招待した人が決めたとおりです。目標だけ自由に決めてください',
      reject: '辞退する',
      rejectTitle: '招待を辞退しますか？',
      rejectBody: '辞退すると、このチームビンゴに参加できません',
    },
    status: {
      pendingAccept: '承諾待ち',
      leaveTeamMenuItem: 'チームを抜ける',
      startCountdown: '{{days}}日後にみんなで始めます。そこからマスを埋められます',
      endedShared: '私たちのチームは{{total}}マス中{{checked}}マスを埋めました 👏',
      endedNoWinner: 'チームビンゴが終了しました 👏',
      winner: '{{names}}さんが1位です！ 👑',
      participants: '参加者',
      boardNotCreated: 'まだビンゴ盤を\n作っていません',
      boardLoadFailRefresh: 'ビンゴ盤を読み込めませんでした\n下に引っ張って更新してください',
      noBingo: 'ビンゴ盤が見つかりません',
      noJoinedMembers: 'まだ参加した人がいません\n招待を承諾するとここに表示されます',
      retrospectiveTitle: '振り返り',
      retrospectiveDescription:
        'この期間がどうだったか残してみましょう。チームメンバーも見られます',
      retrospectivePlaceholder: '振り返りを残してみましょう',
      retrospectiveSaveFail:
        '振り返りを保存できませんでした。しばらくしてからもう一度お試しください',
      noOtherRetrospective: 'まだ他の人の振り返りはありません',
      sharedModeInfo:
        '先にタップした人がそのマスの持ち主になり、埋めたマスはその人だけが解除できます',
      rankFrozenInfo: '順位は終了時点の達成率で確定しました',
      rankInfo: '順位は達成率（埋めたマス ÷ 全マス）で決まるため、盤の大きさが違っても公平です',
      periodEnded: '終了',
      periodDaysUntilStart: '{{days}}日後に開始',
      howMany: '{{count}}人',
      periodDday: 'D-{{days}}',
    },
    mode: {
      shared: {
        label: '一緒にやる',
        description: '1枚のビンゴ盤を一緒に埋めます',
        guide:
          'ビンゴ盤を1枚作って、友だちと一緒に完成させます\nマスの内容とテーマはホストである自分だけが編集できます',
      },

      competition: {
        label: '競う',
        description: 'それぞれビンゴを作って競います',
        guide: 'それぞれビンゴ盤を作って競います\n招待を送ると、友だちもそれぞれビンゴを作ります',
      },

      copied: {
        label: '同じ目標で',
        description: '同じ目標で始めて、それぞれ自分の盤を埋めます',
        guide: '同じ目標で始めて、それぞれ自分の盤を埋めます',
      },
    },

    alert: {
      fullBingo:
        '進行中のビンゴを終えると一緒にできます\nビンゴは同時に{{count}}個まで進行できます',
      fullTeammate: '定員に達しました。チームビンゴは{{count}}人まで参加できます',
      needBingo: '自分のビンゴを作る必要がある招待です\n招待状を開いて参加してください',
      endedBingo: 'すでに終了したビンゴです',
      endedInvite: 'キャンセルまたは終了した招待です',
      removedBingo: 'ホストがビンゴ盤を削除したため参加できません',
      loadFail: 'ビンゴ盤を読み込めませんでした',
      acceptFailed: '承諾に失敗しました',
    },

    error: {
      generate: 'チームビンゴの作成に失敗しました',
      load: '友だちのビンゴ盤を読み込めませんでした',
      loadInvite: '招待を読み込めませんでした',
      reject: '辞退に失敗しました',
      status: 'チーム情報を読み込めません',
      info: 'チーム情報を読み込めませんでした',
      inviteMissing: '招待が見つかりません',
      inviteExpired: '承諾できませんでした',
      inviteDeny: '辞退できませんでした',
    },
    leaveModal: {
      title: 'チームを抜けますか？',
      bodyShare: '自分が埋めたマスはそのまま残ります。ホストの場合は、次の人に引き継がれます。',
      bodySolo: '自分のビンゴは個人ビンゴとして残り、チームの順位からのみ外れます',
      fail: 'チームからの退出に失敗しました',
    },
  },

  update: {
    title: 'アップデートが必要です',
    description: '新しいバージョンにアップデートしないと\n引き続きご利用いただけません',
    button: 'アップデートする',
  },

  badge: {
    get: '獲得',
    loadError: 'バッジを読み込めませんでした',
    empty: 'まだ獲得したバッジがありません',
    more: 'さらに多くのバッジが追加される予定です',

    cell_1: {
      name: '最初の一歩',
      message: 'ビンゴのマスを10個達成しました！ 🎉',
    },
    cell_2: {
      name: 'コツコツ挑戦',
      message: 'ビンゴのマスを30個達成しました！ 🎉',
    },
    cell_3: {
      name: '目標達成者',
      message: 'ビンゴのマスを50個達成しました！ 🎉',
    },
    cell_4: {
      name: 'ビンゴマスター',
      message: 'ビンゴのマスを100個達成しました！ 🏆',
    },

    like_1: {
      name: '初めてのいいね',
      message: '初めていいねを押しました！ 💙',
    },
    like_2: {
      name: 'いいね好き',
      message: 'いいねを10個押しました！ 💙',
    },
    like_3: {
      name: 'いいねブースト',
      message: 'いいねを50個押しました！ ❤️',
    },
    like_4: {
      name: 'いいね大魔王',
      message: 'いいねを100個押しました！ ❤️',
    },

    comment_1: {
      name: '初めてのコメント',
      message: '初めてコメントを書きました！ 💬',
    },
    comment_2: {
      name: 'おしゃべり上手',
      message: 'コメントを30個書きました！ 💬',
    },
    comment_3: {
      name: 'コミュニケーション王',
      message: 'コメントを50個書きました！ 👑',
    },
    comment_4: {
      name: 'コメントマスター',
      message: 'コメントを100個書きました！ 👑',
    },

    post_1: {
      name: '初めての投稿',
      message: '初めて投稿を書きました！ 📝',
    },
    post_2: {
      name: '活発な活動家',
      message: '投稿を30個書きました！ 📝',
    },
    post_3: {
      name: 'コミュニティスター',
      message: '投稿を50個書きました！ ⭐',
    },
    post_4: {
      name: '伝説の作家',
      message: '投稿を80個書きました！ 🏆',
    },

    notification: '🏅 新しいバッジを獲得！ {{name}} - {{message}}',
  },
};
