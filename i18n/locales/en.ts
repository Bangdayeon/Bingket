export default {
  postWritingNotice: {
    line1: 'Please avoid content that may offend or harm others',
    line2:
      "Posts containing slander, profanity, false claims, or anything else that harms others aren't allowed",
    line3: 'Please write considerately so everyone can enjoy communicating',
    line4:
      "Content that infringes on others' rights or causes offense may be deleted without notice",
  },
  common: {
    screen: {
      home: 'Home',
      board: 'Board',
      bingos: 'Browse Bingos',
      notifications: 'Notifications',
      mypage: 'My Space',
    },
    date: 'YYYY.MM.DD',

    bingo: {
      bingo: 'Bingo',
      achieve: 'Achieved',
      achieveDate: 'Achieved on',
      endDate: 'End date',
      emptyBingo: "This bingo can't be viewed.",
      memoPlaceholder: 'Enter a memo.',
    },

    field: {
      email: 'Email',
      password: 'Password',
    },

    visibility: {
      label: 'Bingo visibility',
      public: 'Public',
      public_des: 'Anyone can see your bingo',
      friends: 'Friends only',
      friends_des: 'Only your friends can see your bingo',
      private: 'Private',
      private_des: 'Only you can see your bingo',
    },

    // Actions
    confirm: 'Confirm',
    cancel: 'Cancel',
    delete: 'Delete',
    next: 'Next',
    previous: 'Previous',
    start: 'Get started',
    select: 'Select',

    retry: 'Try again',
    editFail: 'Failed to change',

    // Navigation / UI
    more: 'More',
    save: 'Save',
    unsaved: {
      title: 'You have unsaved changes',
      body: "If you leave now, your changes won't be saved",
      cancel: 'Keep editing',
      confirm: 'Leave',
    },
    // States
    noSearchResult: 'No results found',
    offline: "You're offline · It will refresh automatically once you're connected",

    error: {
      imageUpload: 'Failed to upload the image',
      save: "Couldn't save",
      general: 'Something went wrong',
      retry: 'Please try again in a moment',
      unknown: 'An unknown error occurred',
      network: 'A network error occurred',
    },

    // Bingo status labels
    stateDraft: 'Drafting',
    stateProgress: 'In progress',
    stateDone: 'Completed',

    permission: {
      cameraTitle: 'Camera permission is required',
      cameraBody: 'Please allow camera access in Settings',
      albumTitle: 'Photo library permission is required',
      albumBody: 'Please allow photo access in Settings',
    },

    limitPlaceholder: 'Enter up to {{count}} characters',
  },

  onboarding: {
    msg1: 'Fill the bingo board with\ngoals that were hard to reach',
    msg2: "If you can't stay motivated alone,\ndo it with friends and family",
    msg3: "Share your goals with others\nand cheer each other's challenges on",
    msg4: 'Achieve your goals step by step\nand collect badges',
    msg5: 'Your own challenges, filled into a bingo board.\nStart on Bingket',
  },

  auth: {
    apple: 'Apple',
    google: 'Google',
    kakao: 'Kakao',
    email: 'Email',

    needLogin: 'Please log in',

    startWith: {
      apple: 'Continue with Apple',
      google: 'Continue with Google',
      email: 'Continue with email',
      kakao: 'Continue with Kakao',
    },

    field: {
      email: 'Email',
      password: 'Password',
      passwordConfirm: 'Confirm password',
    },

    placeholder: {
      email: 'Enter your email',
      password: 'At least 8 characters with letters, numbers, and symbols',
      passwordConfirm: 'Re-enter your password',
    },

    validation: {
      invalidEmail: 'Please enter a valid email address',
      invalidPassword: 'Password must be at least 8 characters',
      missingPassword: 'Please enter your password',
      missingPasswordConfirm: 'Please confirm your password',
      passwordMismatch: "Passwords don't match",
      alreadyRegistered: 'This email is already registered',
    },

    login: {
      failed: 'Login failed',
      required: 'Please log in',
    },

    agreement: {
      title: 'Required agreements',
      all: 'Agree to all',
      term: 'Agree to the Terms of Service',
      privacy: 'Agree to the collection and use of personal information',
      over14: "I'm 14 years old or older",
    },

    continue: 'Continue',
  },

  bingo: {
    label: 'Bingo',
    board: 'Bingo board',
    user: 'Bingo user',
    empty: "This bingo can't be viewed",
    visibility: {
      label: 'Bingo visibility',
      public: 'Public',
      publicDescription: 'Anyone can see your bingo',
      friends: 'Friends only',
      friendsDescription: 'Only your friends can see your bingo',
      private: 'Private',
      privateDescription: 'Only you can see your bingo',
    },

    doneDate: 'Completed on',
    achievedDate: 'Achieved on',
    stat: {
      achievement: 'Achieved',
      bingo: 'Bingo',
      endDate: 'End date',
    },

    cellGrid: {
      label: 'Number of cells',
      hint: "Can't be changed after saving",
      description: 'Diagonal lines of 3 cells also count as a bingo',
    },

    modifyCount: {
      label: 'Edits per cell',
      none: 'No edits',
      count: '{{count}} time(s)',
      infinite: 'Unlimited',
      hint: "Can't be changed after saving",
    },

    cell: {
      label: 'Write your bingo',
      hint: 'Tap each cell to fill in your bingo',
      placeholder: 'Up to 30 characters',
    },

    error: {
      bingoSave: "Couldn't save the bingo board",
      create: 'Failed to create bingo',
    },

    competition: {
      alreadyTitle: 'This cell is already filled',
      alreadyBody: 'Too late! Another teammate has already filled this cell',
      my: 'Filled by me',
      nobody: 'Former member',
      other: ' filled this',
    },

    memo: {
      placeholder: 'Enter a memo',
      saved: 'Saved',
      saveFailed: 'Failed to save',
    },

    theme: {
      default: 'Default',
      rabbit: 'Rabbit',
      redHorse: 'Red Horse',
      squareCat: 'Square Cat',
      pig: 'Pig',
      midnight: 'Midnight',
    },
  },

  invite: {
    error: {
      missing: "Couldn't find the invitation.",
      expired: "Couldn't accept.",
      deny: "Couldn't decline.",
    },
  },

  home: {
    empty: "You don't have any bingos yet\nShall we make your first one?",
    // Add bingo section
    addBingo: {
      default: 'Add bingo',
      friends: 'Play with friends',
      myself: 'Play solo',
      clean: 'Please clean up your bingos first',
      cleanDescription: 'You can have up to {{count}} bingos in progress at a time',
    },

    // invite: 'Invite',
    memo: 'Memo',
    memoEdit: 'Edit memo',
    memoPlaceholder: 'Enter a memo',
    modifyBingo: 'Edit bingo',
    lastModify: 'Last edited',

    btnLabel: {
      temporarySave: 'Save draft',
      add: 'Add',
      creating: 'Creating...',
      processing: 'Processing...',
      startBingoWith: 'Send invitations',
    },

    field: {
      title: {
        word: 'Title',
        label: 'Enter a title',
      },

      duration: {
        word: 'Goal period',
        label: 'Select a goal period',
        oneMonth: '1 month',
        threeMonths: '3 months',
        sixMonths: '6 months',
        oneYear: '1 year',
        custom: 'Custom',
        startDate: 'Start date',
        endDate: 'End date',
        selectStartDate: 'Select a start date',
        selectEndDate: 'Select an end date',
      },

      selectTheme: 'Theme',
      modifyCount: {
        label: 'Number of bingo edits allowed',
        infinite: 'Unlimited',
      },

      bet: {
        label: 'Bet',
      },
      reward: {
        label: 'Achievement reward',
      },

      friend: {
        label: 'Select friends',
        selected: '{{count}} selected',
        invite: 'Friends to invite',
        description: 'You can play with up to {{count}} friends.',
      },
    },
    alert: {
      fillAllCells: 'Please fill in all the bingo cells',
      selectFriends: 'Please select at least one friend to play with',
    },

    error: {
      save: 'Failed to save',
      delete: 'Failed to delete',
      load: "Couldn't load the bingo",
      loadInvite: "Couldn't load the invitation.",
      reject: 'Failed to decline.',
      teamStatus: "Can't load team information.",
      teamInfoLoad: "Couldn't load team information.",
    },

    // Sentences
    temporarySaved: 'Saved as a draft\nYou can continue from the Home screen',
    deleteConfirm: 'Are you sure you want to delete this bingo?',
    deleteBody: "A deleted bingo can't be restored",

    // Team invitations
    inviteCompetitionMessage: '{{name}} wants to compete with you in bingo',
    inviteTogetherMessage: '{{name}} wants to do bingo with you',
    period: 'Period: {{startDate}} ~ {{endDate}}',
    daysUntilEnd: '{{days}} day(s) until the end date',
    daysUntilStart: 'Everyone starts together in {{days}} day(s)',
    currentMemberCount: '{{count}} participant(s) so far',
    composingDescription:
      'The period is set by whoever invited you. You just need to set your own goals.',
    rejectInvite: 'Decline',
    rejectInviteTitle: 'Decline the invitation?',
    rejectInviteBody: "If you decline, you won't be able to join this team bingo.",

    // Save confirmation modal
    modal: {
      save: {
        title: 'Create bingo',
        body: "The goal period, number of cells, and number of edits\ncan't be changed after saving\nCreate the bingo as is?",
        cancel: 'Review once more',
        confirm: 'Create bingo',
      },
      friend: {
        title:
          "The period and cell contents can't be changed after creation\nSend invitations to {{count}} friend(s)?",
        cancel: 'Review once more',
        confirm: 'Send invitations',
      },
      leaveTeam: {
        title: 'Leave the team?',
        body_share:
          "Cells you filled will stay as they are. If you're the host, hosting passes to the next person.",
        body_solo:
          'Your bingo will remain as a personal bingo. You will only be removed from the team ranking.',
        fail: 'Failed to leave the team.',
      },
    },
    saveConfirmTitle: 'Create bingo',
    saveConfirmCancel: 'Review once more',
    okAndCreate: 'Accept and create bingo',
    doWith: 'Join in',

    // Team status screen (TeamStatusScreen)
    pendingAccept: 'Awaiting response',
    leaveTeamMenuItem: 'Leave team',

    teamStartCountdown:
      'Everyone starts together in {{days}} day(s). You can fill in cells from then.',
    teamEndedShared: 'Our team filled {{checked}} of {{total}} cells 👏',
    teamEndedNoWinner: 'The team bingo has ended 👏',
    teamWinner: '{{names}} took 1st place! 👑',
    participants: 'Participants',
    boardNotCreated: "Hasn't created a\nbingo board yet",
    boardLoadFailRefresh: "Couldn't load the bingo board\nPull down to refresh",
    noBingo: "Can't find the bingo board.",
    noJoinedMembers: "No one has joined yet\nThey'll show up here once they accept the invitation",
    retrospectiveTitle: 'Reflection',
    retrospectiveDescription: 'Share how this period was for you. Your teammates can see it too.',
    retrospectivePlaceholder: 'Leave a reflection.',
    retrospectiveSaveFail: "Couldn't save your reflection. Please try again in a moment.",
    noOtherRetrospective: 'No one else has left a reflection yet',
    sharedModeInfo:
      'Whoever taps a cell first becomes its owner. Only they can uncheck a filled cell.',
    rankFrozenInfo: 'Rankings were finalized by the achievement rate at the end.',
    rankInfo:
      'Rankings are based on achievement rate (filled cells ÷ total cells), so it is fair even if board sizes differ.',

    periodEnded: 'Ended',
    periodDaysUntilStart: 'Starts in {{days}} day(s)',
    howmany: '{{count}} people',
    periodDday: 'D-{{days}}',
  },

  board: {
    author: 'Author',
    anonymous: 'Anonymous',
    unknown: '(Unknown)',
    submit: 'Post',
    badWord: 'You used an inappropriate expression',

    timeAgo: {
      justNow: 'Just now',
      minutesAgo: '{{count}} min ago',
      hoursAgo: '{{count}} hr ago',
      daysAgo: '{{count}} day(s) ago',
      monthsAgo: '{{count}} month(s) ago',
    },

    post: {
      empty: 'No posts yet\nBe the first to write one',
      create: {
        title: 'Write a post',
        error: 'Failed to create the post',
      },

      edit: {
        menu: 'Edit',
        title: 'Edit post',
        error: 'Failed to edit the post',
      },

      delete: {
        menu: 'Delete',
        title: 'Delete this post?',
        body: "A deleted post can't be recovered",
        error: 'Failed to delete the post',
      },

      form: {
        contentPlaceholder: 'Enter your content',
      },

      attachment: {
        loadBingo: 'Load bingo',
        takePhoto: 'Take a photo',
        pickFromAlbum: 'Choose from album',
      },

      bingo: {
        empty: 'No bingos',
        create: 'Create bingo',
        loadError: "Couldn't load the bingo list",
      },

      error: {
        notFound: "Can't find the post",
        like: "Couldn't register your like. Please try again in a moment",
      },
    },

    comment: {
      first: 'Leave the first comment',
      placeholder: 'Enter a comment',
      warning: 'Inappropriate content may be penalized',
      writingTo: 'Replying to {{author}}',
      more: 'More comments',

      delete: {
        title: 'Delete this comment?',
        deleted: 'This comment has been deleted',
        description: "A deleted comment can't be recovered",
      },

      error: {
        load: "Couldn't load comments",
        create: 'Failed to post the comment',
        delete: 'Failed to delete the comment',
      },
    },

    moderation: {
      report: {
        menu: 'Report',
        explanation:
          'Users with 3 or more accumulated reports may be restricted from using the community',
        confirm: 'Report',

        reason: {
          ad: 'Commercial ads and sales',
          abuse: 'Profanity/insults',
          sexual: 'Obscene/sexual content',
          spam: 'Spam',
          impersonation: 'Impersonation/fraud',
          other: 'Other',
        },

        success: {
          title: 'Report submitted',
          body: "We'll take action on your report within 24 hours",
        },

        error: 'Failed to submit the report',
      },

      block: {
        menu: 'Block',
        body: "Block this user?\nPosts and comments from blocked users won't be shown",
        confirm: 'Block',

        success: {
          title: 'User blocked',
          body: "You won't see posts and comments from this user anymore",
        },

        error: 'Failed to block',
      },
    },

    search: {
      placeholder: 'Search titles · content · comments',
      recent: 'Recent searches',
      deleteAll: 'Delete all',
      empty: 'No recent searches',
      error: "Couldn't search",
    },
  },

  notifications: {
    setAllRead: 'Mark all as read',
    empty: 'No new notifications',
    more: 'More notifications',

    title: {
      default: 'New notification',
      bingoReminder: 'The deadline is coming up',
      bingoDday: 'The deadline is tomorrow',
      teamInvite: 'You received a bingo invitation',
      teamFinished: 'The bingo has ended',
      comment: 'Your post has a new comment',
      reply: 'Your post has a new comment',
      like: 'Your post received a like',
      friendRequest: 'You received a friend request',
      teamJoined: 'Someone newly joined the team',
      teamInviteDeclined: 'Someone declined to join',
      teamCellChecked: 'A teammate filled a cell',
      badge: 'You earned a new badge',
      popular: 'Your post became popular',
    },

    time: {
      justNow: 'Just now',
      minutesAgo: '{{count}} min ago',
      hoursAgo: '{{count}} hr ago',
      daysAgo: '{{count}} day(s) ago',
    },

    action: {
      confirm: 'Accept',
      confirm_short: 'Accept',
      deny: 'Decline',
      deny_short: 'Decline',
      checkInvite: 'View invitation',
      checkTeamStatus: 'View team status',
    },

    error: "Couldn't load notifications",
  },

  my: {
    feed: 'Feed',
    badge: 'Badges',

    post: {
      title: 'Posts',
      empty: "You haven't written any posts yet",
      emptyBtn: 'Browse the board',
    },
  },

  profile: {
    feedEmpty: 'The feed is empty',
    visible: {
      friend: 'Only friends can see this',
      friendDescription: 'Become friends to see their bingos and badges',
      locked: 'This is a private account',
      lockedDescription: "This account doesn't share its bingos and badges",
    },

    beFriend: {
      require: 'Add friend',
      required: 'Friend request sent',
    },

    error: {
      loadProfile: "Couldn't load the profile",
      friendRequire: 'Failed to send the friend request',
      notFound: 'User not found',
    },
  },

  settings: {
    label: 'Settings',
    closeMenu: 'Close menu',
    profile: {
      label: 'Edit profile',

      image: {
        label: 'Profile photo',
        camera: 'Camera',
        album: 'Choose from album',
        default: 'Use default image',
      },

      nickname: {
        label: 'Nickname',
        placeholder: 'Enter up to {{count}} characters',
        mixture: 'Only Korean, English letters, and numbers are allowed',
        error: 'Please enter a nickname',
      },

      id: {
        label: 'ID',
        placeholder:
          'Up to {{count}} characters using English letters, underscores, hyphens, and numbers only',
        mixture: 'Only English letters, numbers, _ and - are allowed',
        error: 'Please enter an ID',
      },
      bio: {
        label: 'One-line resolution',
        edit: 'Edit one-line resolution',
        empty: "You don't have a one-line resolution yet",
        placeholder: 'Enter up to {{count}} characters',
      },
    },

    account: {
      label: 'Account management',
      linkedInfo: 'Linked account info',
      linkedInfoFail: "Couldn't load linked accounts",
      linkedInfoEmpty: 'No linked accounts',

      visibility: 'Account visibility',
      public: 'Public',
      publicDescription: 'Anyone can see the bingos you wrote, and your account is searchable',
      friends: 'Friends only',
      friendsDescription:
        'Only friends can see the bingos you wrote, and your account is searchable',
      private: 'Private',
      privateDescription:
        "Only you can see the bingos you wrote, and your account isn't searchable",
      visibilityChangeFail: "Couldn't change the visibility",

      reset: {
        label: 'Reset bingos',
        title: 'Are you sure you want to reset your bingos?',
        body: '• All the bingos you created will be deleted\n• Your posts and comments will remain\n• Your account and profile will be kept',
        confirm: 'Reset',
        doneTitle: 'Reset complete',
        doneBody: 'All bingos have been deleted',
      },

      withdraw: {
        label: 'Delete account',
        title: 'Are you sure you want to delete your account?',
        body: "• Your account, profile information, and profile photo will be deleted\n• Data can't be recovered after the account is deleted\n• Your posts and comments will remain as (Unknown), along with any attached photos",
        confirm: 'Delete account',
      },
    },

    notifications: {
      label: 'Notification settings',

      blockTitle: 'Device notifications are turned off',
      blockBody:
        "You won't receive notifications regardless of the settings below. Please turn on app push notifications in your device settings. >",

      bingo: {
        label: 'Bingo',
        deadline: 'Deadline reminders',
      },
      team: {
        label: 'Team bingo',
        teamAction: 'Teammate activity alerts',
      },
      board: {
        label: 'Board',
        comment: 'Comment alerts',
        like: 'Like alerts',
      },

      error: {
        save: 'Failed to save notification settings',
        load: "Couldn't load notification settings",
      },
    },

    theme: {
      label: 'App theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',

      icon: {
        label: 'Icon theme',
        default: 'Default',
        neon: 'Neon',
        sunset: 'Sunset',
        tanning: 'Tanning',
      },
    },

    review: 'Leave an app review',
    faq: 'FAQ',
    terms: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    updateHistory: 'Update history',
    quickInquiry: {
      label: 'Quick inquiry',
      title: 'Inquiry / Report',
      confirm: 'Submit',
      placeholder: 'Enter your inquiry or report',
      successTitle: 'Your inquiry has been received',
      successBody: "We'll review it and take action as soon as possible.",
      error: 'Failed to submit your inquiry. Please try again in a moment',
    },
    developerEmail: 'Developer email',
    emailCopied: 'Email copied',
    versionInfo: 'Version info',
    logout: {
      label: 'Log out',
      title: 'Do you want to log out?',
    },
  },

  friends: {
    label: 'Friends',
    allUsers: 'All users',
    delete: 'Remove friend',
    recieved: 'Received friend requests',
    reRequest: 'Request again',
    add: 'Add friend',

    requestModal: {
      title: 'Friend request',
      body: 'This person has sent you a friend request\nWould you like to accept?',
    },

    noSameFriend: 'No matching friends. Please check the name or ID',
    noFriend: 'No friends yet. Add some friends first',
    deleteConfirm: 'Remove {{displayName}} from your friends list?',
    searchPlaceholder: 'Search by nickname or ID',
    inviteMessage: "Do you have friends who don't use the app yet?\nInvite them to join you",

    team: {
      select: 'Select friends',
      complete: 'Done',
      selectFriend: 'Choose friends to play with. The ones you pick will show up here.',
    },

    invite: {
      label: 'Invite',
      title: 'Achieve your goals with friends on Bingket!',
      description: 'Set goals in a bingo format and achieve them together in the community',
      openApp: 'Open in app',
    },

    error: {
      load: "Couldn't load the friends list",
      invite: 'Failed to share the invite link',
      request: 'Failed to send the friend request',
      search: 'Search failed',
      delete: 'Failed to remove the friend',
      usage: "The share sheet isn't available on this device",
    },
  },

  team: {
    title: 'Play with friends',
    create: {
      friend: {
        label: 'Invite friends',
        selected: '{{count}} selected',
        invite: 'Friends to invite',
        description: 'You can play with up to {{count}} friends',
      },
    },
    selection: {
      select: 'Select friends',
      complete: 'Done',
      selectFriend: 'Choose friends to play with',
    },
    invite: {
      friendsBingo: "{{userName}}'s bingo board",
      competitionMessage: '{{name}} wants to compete with you in bingo',
      togetherMessage: '{{name}} wants to do bingo with you',
      period: 'Period: {{startDate}} ~ {{endDate}}',
      daysUntilEnd: '{{days}} day(s) until the end date',
      daysUntilStart: 'Everyone starts together in {{days}} day(s)',
      currentMemberCount: '{{count}} participant(s) so far',
      composingDescription:
        'The period is set by whoever invited you. You just need to set your own goals',
      reject: 'Decline',
      rejectTitle: 'Decline the invitation?',
      rejectBody: "If you decline, you won't be able to join this team bingo",
    },
    status: {
      pendingAccept: 'Awaiting response',
      leaveTeamMenuItem: 'Leave team',
      startCountdown:
        'Everyone starts together in {{days}} day(s). You can fill in cells from then',
      endedShared: 'Our team filled {{checked}} of {{total}} cells 👏',
      endedNoWinner: 'The team bingo has ended 👏',
      winner: '{{names}} took 1st place! 👑',
      participants: 'Participants',
      boardNotCreated: "Hasn't created a\nbingo board yet",
      boardLoadFailRefresh: "Couldn't load the bingo board\nPull down to refresh",
      noBingo: "Can't find the bingo board",
      noJoinedMembers:
        "No one has joined yet\nThey'll show up here once they accept the invitation",
      retrospectiveTitle: 'Reflection',
      retrospectiveDescription: 'Share how this period was for you. Your teammates can see it too',
      retrospectivePlaceholder: 'Leave a reflection',
      retrospectiveSaveFail: "Couldn't save your reflection. Please try again in a moment",
      noOtherRetrospective: 'No one else has left a reflection yet',
      sharedModeInfo:
        'Whoever taps a cell first becomes its owner, and only they can uncheck a filled cell',
      rankFrozenInfo: 'Rankings were finalized by the achievement rate at the end',
      rankInfo:
        'Rankings are based on achievement rate (filled cells ÷ total cells), so it is fair even if board sizes differ',
      periodEnded: 'Ended',
      periodDaysUntilStart: 'Starts in {{days}} day(s)',
      howMany: '{{count}} people',
      periodDday: 'D-{{days}}',
    },
    mode: {
      shared: {
        label: 'Together',
        description: 'Fill in one bingo board together',
        guide:
          'Write a single bingo board and complete it together with friends\nOnly I, as the host, can edit the cell contents and theme',
      },

      competition: {
        label: 'Compete',
        description: 'Each writes their own bingo and competes',
        guide:
          'Each person writes their own bingo board and competes\nOnce you send invitations, your friends write their own bingos',
      },

      copied: {
        label: 'Same goals',
        description: 'Start with the same goals and fill in your own boards',
        guide: 'Start with the same goals and fill in your own boards',
      },
    },

    alert: {
      fullBingo:
        'You can join once you finish a bingo in progress\nYou can have up to {{count}} bingos in progress at a time',
      fullTeammate: 'The team is full. A team bingo can have up to {{count}} participants',
      needBingo:
        'This invitation requires you to create your own bingo\nOpen the invitation to join',
      endedBingo: 'This bingo has already ended',
      endedInvite: 'This invitation was canceled or has ended',
      removedBingo: "You can't join because the host deleted the bingo board",
      loadFail: "Couldn't load the bingo board",
      acceptFailed: 'Failed to accept',
    },

    error: {
      generate: 'Failed to create team bingo',
      load: "Couldn't load your friend's bingo board",
      loadInvite: "Couldn't load the invitation",
      reject: 'Failed to decline',
      status: "Can't load team information",
      info: "Couldn't load team information",
      inviteMissing: "Couldn't find the invitation",
      inviteExpired: "Couldn't accept",
      inviteDeny: "Couldn't decline",
    },
    leaveModal: {
      title: 'Leave the team?',
      bodyShare:
        "Cells you filled will stay as they are. If you're the host, hosting passes to the next person.",
      bodySolo:
        'Your bingo will remain as a personal bingo and you will only be removed from the team ranking',
      fail: 'Failed to leave the team',
    },
  },

  update: {
    title: 'Update required',
    description: 'You need to update to the new version\nto keep using the app',
    button: 'Go to update',
  },

  badge: {
    get: 'Earned',
    loadError: "Couldn't load badges",
    empty: "You haven't earned any badges yet",
    more: 'More badges are coming soon',

    cell_1: {
      name: 'First Step',
      message: 'You completed 10 bingo cells! 🎉',
    },
    cell_2: {
      name: 'Steady Challenger',
      message: 'You completed 30 bingo cells! 🎉',
    },
    cell_3: {
      name: 'Goal Achiever',
      message: 'You completed 50 bingo cells! 🎉',
    },
    cell_4: {
      name: 'Bingo Master',
      message: 'You completed 100 bingo cells! 🏆',
    },

    like_1: {
      name: 'First Like',
      message: 'You gave your first like! 💙',
    },
    like_2: {
      name: 'Like Buddy',
      message: 'You gave 10 likes! 💙',
    },
    like_3: {
      name: 'Like Booster',
      message: 'You gave 50 likes! ❤️',
    },
    like_4: {
      name: 'Like Overlord',
      message: 'You gave 100 likes! ❤️',
    },

    comment_1: {
      name: 'First Comment',
      message: 'You wrote your first comment! 💬',
    },
    comment_2: {
      name: 'Storyteller',
      message: 'You wrote 30 comments! 💬',
    },
    comment_3: {
      name: 'Communication King',
      message: 'You wrote 50 comments! 👑',
    },
    comment_4: {
      name: 'Comment Master',
      message: 'You wrote 100 comments! 👑',
    },

    post_1: {
      name: 'First Post',
      message: 'You wrote your first post! 📝',
    },
    post_2: {
      name: 'Active Member',
      message: 'You wrote 30 posts! 📝',
    },
    post_3: {
      name: 'Community Star',
      message: 'You wrote 50 posts! ⭐',
    },
    post_4: {
      name: 'Legendary Writer',
      message: 'You wrote 80 posts! 🏆',
    },

    notification: '🏅 New badge earned! {{name}} - {{message}}',
  },
};
