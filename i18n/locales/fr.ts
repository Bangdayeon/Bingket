export default {
  postWritingNotice: {
    line1: 'Évite les contenus qui pourraient choquer ou nuire aux autres',
    line2:
      'Les publications contenant des insultes, des injures, de fausses informations ou tout contenu nuisible pour autrui ne sont pas autorisées',
    line3:
      'Rédige tes publications avec bienveillance pour que chacun puisse échanger dans de bonnes conditions',
    line4:
      'Tout contenu portant atteinte aux droits d’autrui ou jugé offensant peut être supprimé sans préavis',
  },
  common: {
    screen: {
      home: 'Accueil',
      board: 'Forum',
      notifications: 'Notifications',
      mypage: 'Mon espace',
    },
    date: 'AAAA.MM.JJ',

    bingo: {
      bingo: 'Bingo',
      achieve: 'Réalisé',
      achieveDate: 'Date de réussite',
      endDate: 'Date de fin',
      emptyBingo: 'Ce bingo n’est pas accessible.',
      memoPlaceholder: 'Saisis une note.',
    },

    field: {
      email: 'E-mail',
      password: 'Mot de passe',
    },

    visibility: {
      label: 'Visibilité du bingo',
      public: 'Public',
      public_des: 'Tout le monde peut voir ton bingo',
      friends: 'Amis uniquement',
      friends_des: 'Seuls tes amis peuvent voir ton bingo',
      private: 'Privé',
      private_des: 'Toi seul(e) peux voir ton bingo',
    },

    // Actions
    confirm: 'Confirmer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    next: 'Suivant',
    previous: 'Précédent',
    start: 'Commencer',
    select: 'Sélectionner',

    retry: 'Réessayer',
    editFail: 'Échec de la modification',

    // Navigation / UI
    more: 'Voir plus',
    save: 'Enregistrer',
    unsaved: {
      title: 'Tu as des modifications non enregistrées',
      body: 'Si tu quittes maintenant, tes modifications ne seront pas enregistrées',
      cancel: 'Continuer la modification',
      confirm: 'Quitter',
    },
    // States
    noSearchResult: 'Aucun résultat',
    offline: 'Tu es hors ligne · L’actualisation se fera automatiquement une fois reconnecté(e)',

    error: {
      imageUpload: 'Échec de l’envoi de l’image',
      save: 'Impossible d’enregistrer',
      general: 'Une erreur est survenue',
      retry: 'Réessaie dans un instant',
      unknown: 'Une erreur inconnue est survenue',
      network: 'Une erreur réseau est survenue',
    },

    // Bingo status labels
    stateDraft: 'En préparation',
    stateProgress: 'En cours',
    stateDone: 'Terminé',

    permission: {
      cameraTitle: 'L’autorisation d’accès à l’appareil photo est nécessaire',
      cameraBody: 'Autorise l’accès à l’appareil photo dans les réglages',
      albumTitle: 'L’autorisation d’accès à la galerie est nécessaire',
      albumBody: 'Autorise l’accès aux photos dans les réglages',
    },

    limitPlaceholder: 'Saisis {{count}} caractères maximum',
  },

  onboarding: {
    msg1: 'Remplis la grille de bingo avec\ndes objectifs difficiles à atteindre',
    msg2: 'Si tu manques de motivation seul(e),\nfais-le avec tes amis et ta famille',
    msg3: 'Partage tes objectifs avec les autres\net encouragez-vous mutuellement',
    msg4: 'Atteins tes objectifs pas à pas\net collectionne des badges',
    msg5: 'Tes propres défis à remplir dans un bingo,\ncommence sur Bingket',
  },

  auth: {
    apple: 'Apple',
    google: 'Google',
    kakao: 'Kakao',
    email: 'E-mail',

    needLogin: 'Connexion requise',

    startWith: {
      apple: 'Commencer avec Apple',
      google: 'Commencer avec Google',
      email: 'Commencer avec un e-mail',
      kakao: 'Commencer avec Kakao',
    },

    field: {
      email: 'E-mail',
      password: 'Mot de passe',
      passwordConfirm: 'Confirmer le mot de passe',
    },

    placeholder: {
      email: 'Saisis ton e-mail',
      password: '8 caractères minimum avec lettres, chiffres et symboles',
      passwordConfirm: 'Saisis à nouveau ton mot de passe',
    },

    validation: {
      invalidEmail: 'Saisis une adresse e-mail valide',
      invalidPassword: 'Le mot de passe doit contenir au moins 8 caractères',
      missingPassword: 'Saisis ton mot de passe',
      missingPasswordConfirm: 'Confirme ton mot de passe',
      passwordMismatch: 'Les mots de passe ne correspondent pas',
      alreadyRegistered: 'Cet e-mail est déjà utilisé',
    },

    login: {
      failed: 'Échec de la connexion',
      required: 'Connexion requise',
    },

    agreement: {
      title: 'Consentements obligatoires pour utiliser le service',
      all: 'Tout accepter',
      term: 'J’accepte les conditions d’utilisation',
      privacy: 'J’accepte la collecte et l’utilisation des données personnelles',
      over14: 'J’ai 14 ans ou plus',
    },

    continue: 'Continuer',
  },

  bingo: {
    label: 'Bingo',
    board: 'Grille de bingo',
    user: 'Utilisateur du bingo',
    empty: 'Ce bingo n’est pas accessible',
    visibility: {
      label: 'Visibilité du bingo',
      public: 'Public',
      publicDescription: 'Tout le monde peut voir ton bingo',
      friends: 'Amis uniquement',
      friendsDescription: 'Seuls tes amis peuvent voir ton bingo',
      private: 'Privé',
      privateDescription: 'Toi seul(e) peux voir ton bingo',
    },

    doneDate: 'Date de fin',
    achievedDate: 'Date de réussite',
    stat: {
      achievement: 'Réalisé',
      bingo: 'Bingo',
      endDate: 'Date de fin',
    },

    cellGrid: {
      label: 'Nombre de cases',
      hint: 'Non modifiable après l’enregistrement',
      description: 'Les diagonales de 3 cases comptent aussi comme un bingo',
    },

    modifyCount: {
      label: 'Modifications par case',
      none: 'Aucune modification',
      count: '{{count}} fois',
      infinite: 'Illimitées',
      hint: 'Non modifiable après l’enregistrement',
    },

    cell: {
      label: 'Rédiger ton bingo',
      hint: 'Touche chaque case pour remplir ton bingo',
      placeholder: '30 caractères maximum',
    },

    error: {
      bingoSave: 'Impossible d’enregistrer la grille de bingo',
      create: 'Échec de la création du bingo',
    },

    competition: {
      alreadyTitle: 'Cette case est déjà remplie',
      alreadyBody: 'Trop tard ! Un autre membre de l’équipe a déjà rempli cette case',
      my: 'Remplie par moi',
      nobody: 'Ancien membre',
      other: ' l’a remplie',
    },

    memo: {
      placeholder: 'Saisis une note',
      saved: 'Enregistré',
      saveFailed: 'Échec de l’enregistrement',
    },

    theme: {
      default: 'Par défaut',
      rabbit: 'Lapin',
      redHorse: 'Cheval rouge',
      squareCat: 'Chat carré',
      pig: 'Cochon',
      midnight: 'Minuit',
    },
  },

  invite: {
    error: {
      missing: 'Invitation introuvable.',
      expired: 'Impossible d’accepter.',
      deny: 'Impossible de refuser.',
    },
  },

  home: {
    empty: 'Tu n’as encore aucun bingo\nOn crée le premier ?',
    // Add bingo section
    addBingo: {
      default: 'Ajouter un bingo',
      friends: 'Jouer avec des amis',
      myself: 'Jouer seul(e)',
      clean: 'Fais d’abord le tri dans tes bingos',
      cleanDescription: 'Tu peux avoir jusqu’à {{count}} bingos en cours à la fois',
    },

    // invite: 'Inviter',
    memo: 'Note',
    memoEdit: 'Modifier la note',
    memoPlaceholder: 'Saisis une note',
    modifyBingo: 'Modifier le bingo',
    lastModify: 'Dernière modification',

    btnLabel: {
      temporarySave: 'Enregistrer le brouillon',
      add: 'Ajouter',
      creating: 'Création en cours...',
      processing: 'Traitement en cours...',
      startBingoWith: 'Envoyer les invitations',
    },

    field: {
      title: {
        word: 'Titre',
        label: 'Saisis un titre',
      },

      duration: {
        word: 'Durée de l’objectif',
        label: 'Choisis la durée de l’objectif',
        oneMonth: '1 mois',
        threeMonths: '3 mois',
        sixMonths: '6 mois',
        oneYear: '1 an',
        custom: 'Personnalisée',
        startDate: 'Date de début',
        endDate: 'Date de fin',
        selectStartDate: 'Choisis la date de début',
        selectEndDate: 'Choisis la date de fin',
      },

      selectTheme: 'Thème',
      modifyCount: {
        label: 'Nombre de modifications autorisées',
        infinite: 'Illimité',
      },

      bet: {
        label: 'Pari',
      },
      reward: {
        label: 'Récompense de réussite',
      },

      friend: {
        label: 'Choisir des amis',
        selected: '{{count}} sélectionné(s)',
        invite: 'Amis à inviter',
        description: 'Tu peux jouer avec {{count}} amis maximum.',
      },
    },
    alert: {
      fillAllCells: 'Remplis toutes les cases du bingo',
      selectFriends: 'Choisis au moins un ami pour jouer ensemble',
    },

    error: {
      save: 'Échec de l’enregistrement',
      delete: 'Échec de la suppression',
      load: 'Impossible de charger le bingo',
      loadInvite: 'Impossible de charger l’invitation.',
      reject: 'Échec du refus.',
      teamStatus: 'Impossible de charger les informations de l’équipe.',
      teamInfoLoad: 'Impossible de charger les informations de l’équipe.',
    },

    // Sentences
    temporarySaved: 'Brouillon enregistré\nTu pourras le reprendre depuis l’écran d’accueil',
    deleteConfirm: 'Veux-tu vraiment supprimer ce bingo ?',
    deleteBody: 'Un bingo supprimé ne peut pas être récupéré',

    // Team invitations
    inviteCompetitionMessage: '{{name}} veut te défier au bingo',
    inviteTogetherMessage: '{{name}} veut faire un bingo avec toi',
    period: 'Période : {{startDate}} ~ {{endDate}}',
    daysUntilEnd: 'Plus que {{days}} jour(s) avant la fin',
    daysUntilStart: 'On commence tous ensemble dans {{days}} jour(s)',
    currentMemberCount: '{{count}} personne(s) participent actuellement',
    composingDescription:
      'La période est celle choisie par la personne qui t’a invité(e). Tu n’as plus qu’à définir librement tes objectifs.',
    rejectInvite: 'Refuser',
    rejectInviteTitle: 'Refuser l’invitation ?',
    rejectInviteBody: 'Si tu refuses, tu ne pourras pas rejoindre ce bingo d’équipe.',

    // Save confirmation modal
    modal: {
      save: {
        title: 'Créer le bingo',
        body: 'La durée, le nombre de cases et le nombre de modifications\nne pourront plus être changés après l’enregistrement\nCréer le bingo tel quel ?',
        cancel: 'Revoir encore',
        confirm: 'Créer le bingo',
      },
      friend: {
        title:
          'La période et le contenu des cases ne pourront plus être modifiés après la création\nEnvoyer des invitations à {{count}} ami(s) ?',
        cancel: 'Revoir encore',
        confirm: 'Envoyer les invitations',
      },
      leaveTeam: {
        title: 'Quitter l’équipe ?',
        body_share:
          'Les cases que tu as remplies restent telles quelles. Si tu es l’hôte, le rôle passe à la personne suivante.',
        body_solo:
          'Ton bingo restera un bingo personnel. Tu seras seulement retiré(e) du classement de l’équipe.',
        fail: 'Échec de la sortie de l’équipe.',
      },
    },
    saveConfirmTitle: 'Créer le bingo',
    saveConfirmCancel: 'Revoir encore',
    okAndCreate: 'Accepter et créer le bingo',
    doWith: 'Participer',

    // Team status screen (TeamStatusScreen)
    pendingAccept: 'En attente d’acceptation',
    leaveTeamMenuItem: 'Quitter l’équipe',

    teamStartCountdown:
      'On commence tous ensemble dans {{days}} jour(s). Tu pourras remplir les cases à partir de là.',
    teamEndedShared: 'Notre équipe a rempli {{checked}} cases sur {{total}} 👏',
    teamEndedNoWinner: 'Le bingo d’équipe est terminé 👏',
    teamWinner: '{{names}} est en 1re place ! 👑',
    participants: 'Participants',
    boardNotCreated: 'N’a pas encore créé\nde grille de bingo',
    boardLoadFailRefresh:
      'Impossible de charger la grille de bingo\nTire vers le bas pour actualiser',
    noBingo: 'Grille de bingo introuvable.',
    noJoinedMembers:
      'Personne n’a encore rejoint\nLes membres apparaîtront ici dès qu’ils auront accepté l’invitation',
    retrospectiveTitle: 'Bilan',
    retrospectiveDescription:
      'Raconte comment s’est passée cette période pour toi. Les membres de l’équipe pourront aussi le voir.',
    retrospectivePlaceholder: 'Laisse ton bilan.',
    retrospectiveSaveFail: 'Impossible d’enregistrer ton bilan. Réessaie dans un instant.',
    noOtherRetrospective: 'Aucun autre bilan pour le moment',
    sharedModeInfo:
      'La première personne qui touche une case en devient propriétaire. Seule cette personne peut décocher une case remplie.',
    rankFrozenInfo: 'Le classement a été fixé selon le taux de réussite à la fin.',
    rankInfo:
      'Le classement dépend du taux de réussite (cases remplies ÷ total des cases), ce qui reste équitable même si la taille des grilles diffère.',

    periodEnded: 'Terminé',
    periodDaysUntilStart: 'Commence dans {{days}} jour(s)',
    howmany: '{{count}} personne(s)',
    periodDday: 'J-{{days}}',
  },

  board: {
    author: 'Auteur',
    anonymous: 'Anonyme',
    unknown: '(Inconnu)',
    submit: 'Publier',
    badWord: 'Tu as utilisé une expression inappropriée',

    timeAgo: {
      justNow: 'À l’instant',
      minutesAgo: 'Il y a {{count}} min',
      hoursAgo: 'Il y a {{count}} h',
      daysAgo: 'Il y a {{count}} jour(s)',
      monthsAgo: 'Il y a {{count}} mois',
    },

    post: {
      empty: 'Aucune publication pour le moment\nÉcris la première',
      create: {
        title: 'Écrire une publication',
        error: 'Échec de la création de la publication',
      },

      edit: {
        menu: 'Modifier',
        title: 'Modifier la publication',
        error: 'Échec de la modification de la publication',
      },

      delete: {
        menu: 'Supprimer',
        title: 'Supprimer la publication ?',
        body: 'Une publication supprimée ne peut pas être récupérée',
        error: 'Échec de la suppression de la publication',
      },

      form: {
        contentPlaceholder: 'Saisis ton contenu',
      },

      attachment: {
        loadBingo: 'Charger un bingo',
        takePhoto: 'Prendre une photo',
        pickFromAlbum: 'Choisir dans la galerie',
      },

      bingo: {
        empty: 'Aucun bingo',
        create: 'Créer un bingo',
        loadError: 'Impossible de charger la liste des bingos',
      },

      error: {
        notFound: 'Publication introuvable',
        like: 'Impossible d’enregistrer ton j’aime. Réessaie dans un instant',
      },
    },

    comment: {
      first: 'Laisse le premier commentaire',
      placeholder: 'Saisis un commentaire',
      warning: 'Les contenus inappropriés peuvent être sanctionnés',
      writingTo: 'Réponse à {{author}} en cours',
      more: 'Voir plus de commentaires',

      delete: {
        title: 'Supprimer le commentaire ?',
        deleted: 'Ce commentaire a été supprimé',
        description: 'Un commentaire supprimé ne peut pas être récupéré',
      },

      error: {
        load: 'Impossible de charger les commentaires',
        create: 'Échec de la publication du commentaire',
        delete: 'Échec de la suppression du commentaire',
      },
    },

    moderation: {
      report: {
        menu: 'Signaler',
        explanation:
          'Les utilisateurs cumulant 3 signalements ou plus peuvent voir leur accès à la communauté restreint',
        confirm: 'Signaler',

        reason: {
          ad: 'Publicité et vente commerciales',
          abuse: 'Insultes / propos dégradants',
          sexual: 'Contenu obscène / à caractère sexuel',
          spam: 'Spam',
          impersonation: 'Usurpation d’identité / escroquerie',
          other: 'Autre',
        },

        success: {
          title: 'Signalement envoyé',
          body: 'Nous traiterons ton signalement sous 24 heures',
        },

        error: 'Échec du signalement',
      },

      block: {
        menu: 'Bloquer',
        body: 'Veux-tu bloquer cet utilisateur ?\nSes publications et commentaires ne seront plus visibles',
        confirm: 'Bloquer',

        success: {
          title: 'Utilisateur bloqué',
          body: 'Tu ne verras plus les publications ni les commentaires de cet utilisateur',
        },

        error: 'Échec du blocage',
      },
    },

    search: {
      placeholder: 'Rechercher dans titres · contenus · commentaires',
      recent: 'Recherches récentes',
      deleteAll: 'Tout effacer',
      empty: 'Aucune recherche récente',
      error: 'Impossible de lancer la recherche',
    },
  },

  notifications: {
    setAllRead: 'Tout marquer comme lu',
    empty: 'Aucune nouvelle notification',
    more: 'Voir plus de notifications',

    title: {
      default: 'Nouvelle notification',
      bingoReminder: 'L’échéance approche',
      bingoDday: 'L’échéance est demain',
      teamInvite: 'Tu as reçu une invitation à un bingo',
      teamFinished: 'Le bingo est terminé',
      comment: 'Ta publication a reçu un nouveau commentaire',
      reply: 'Ta publication a reçu un nouveau commentaire',
      like: 'Ta publication a reçu un j’aime',
      friendRequest: 'Tu as reçu une demande d’ami',
      teamJoined: 'Un nouveau membre a rejoint l’équipe',
      teamInviteDeclined: 'Une personne a refusé de participer',
      teamCellChecked: 'Un membre de l’équipe a rempli une case',
      badge: 'Tu as obtenu un nouveau badge',
      popular: 'Ta publication est devenue populaire',
    },

    time: {
      justNow: 'À l’instant',
      minutesAgo: 'Il y a {{count}} min',
      hoursAgo: 'Il y a {{count}} h',
      daysAgo: 'Il y a {{count}} jour(s)',
    },

    action: {
      confirm: 'Accepter',
      confirm_short: 'Accepter',
      deny: 'Refuser',
      deny_short: 'Refuser',
      checkInvite: 'Voir l’invitation',
      checkTeamStatus: 'Voir l’état de l’équipe',
    },

    error: 'Impossible de charger les notifications',
  },

  my: {
    feed: 'Fil',
    badge: 'Badges',

    post: {
      title: 'Publications',
      empty: 'Tu n’as encore rien publié',
      emptyBtn: 'Parcourir le forum',
    },
  },

  profile: {
    feedEmpty: 'Le fil est vide',
    visible: {
      friend: 'Visible uniquement par les amis',
      friendDescription: 'Deviens ami(e) pour voir ses bingos et ses badges',
      locked: 'Ce compte est privé',
      lockedDescription: 'Ce compte ne partage pas ses bingos ni ses badges',
    },

    beFriend: {
      require: 'Demander en ami',
      required: 'Demande d’ami envoyée',
    },

    error: {
      loadProfile: 'Impossible de charger le profil',
      friendRequire: 'Échec de la demande d’ami',
      notFound: 'Utilisateur introuvable',
    },
  },

  settings: {
    label: 'Réglages',
    closeMenu: 'Fermer le menu',
    profile: {
      label: 'Modifier le profil',

      image: {
        label: 'Photo de profil',
        camera: 'Appareil photo',
        album: 'Choisir dans la galerie',
        default: 'Utiliser l’image par défaut',
      },

      nickname: {
        label: 'Pseudo',
        placeholder: 'Saisis {{count}} caractères maximum',
        mixture:
          'Seules les combinaisons de hangeul, de lettres anglaises et de chiffres sont autorisées',
        error: 'Saisis un pseudo',
      },

      id: {
        label: 'Identifiant',
        placeholder:
          '{{count}} caractères maximum : lettres anglaises, tirets bas, tirets et chiffres uniquement',
        mixture:
          'Seules les combinaisons de lettres anglaises, de chiffres, de _ et de - sont autorisées',
        error: 'Saisis un identifiant',
      },
      bio: {
        label: 'Résolution en une ligne',
        edit: 'Modifier la résolution en une ligne',
        empty: 'Aucune résolution en une ligne pour le moment',
        placeholder: 'Saisis {{count}} caractères maximum',
      },
    },

    account: {
      label: 'Gestion du compte',
      linkedInfo: 'Informations des comptes liés',
      linkedInfoFail: 'Impossible de charger les comptes liés',
      linkedInfoEmpty: 'Aucun compte lié',

      visibility: 'Visibilité du compte',
      public: 'Public',
      publicDescription:
        'Tout le monde peut voir les bingos que tu as créés, et ton compte apparaît dans les recherches',
      friends: 'Amis uniquement',
      friendsDescription:
        'Seuls tes amis peuvent voir les bingos que tu as créés, et ton compte apparaît dans les recherches',
      private: 'Privé',
      privateDescription:
        'Toi seul(e) peux voir les bingos que tu as créés, et ton compte n’apparaît pas dans les recherches',
      visibilityChangeFail: 'Impossible de modifier la visibilité',

      reset: {
        label: 'Réinitialiser les bingos',
        title: 'Veux-tu vraiment réinitialiser tes bingos ?',
        body: '• Tous les bingos que tu as créés seront supprimés\n• Tes publications et commentaires seront conservés\n• Ton compte et ton profil seront conservés',
        confirm: 'Réinitialiser',
        doneTitle: 'Réinitialisation terminée',
        doneBody: 'Tous les bingos ont été supprimés',
      },

      withdraw: {
        label: 'Supprimer le compte',
        title: 'Veux-tu vraiment supprimer ton compte ?',
        body: '• Ton compte, les informations de ton profil et ta photo de profil seront supprimés\n• Les données ne pourront pas être récupérées après la suppression du compte\n• Tes publications et commentaires resteront affichés comme (Inconnu), avec les photos jointes',
        confirm: 'Supprimer le compte',
      },
    },

    notifications: {
      label: 'Réglages des notifications',

      blockTitle: 'Les notifications de l’appareil sont désactivées',
      blockBody:
        'Tu ne recevras aucune notification, quels que soient les réglages ci-dessous. Active les notifications push de l’application dans les réglages de ton appareil. >',

      bingo: {
        label: 'Bingo',
        deadline: 'Rappels d’échéance',
      },
      team: {
        label: 'Bingo d’équipe',
        teamAction: 'Alertes d’activité de l’équipe',
      },
      board: {
        label: 'Forum',
        comment: 'Alertes de commentaires',
        like: 'Alertes de j’aime',
      },

      error: {
        save: 'Échec de l’enregistrement des réglages de notifications',
        load: 'Impossible de charger les réglages de notifications',
      },
    },

    theme: {
      label: 'Thème de l’application',
      system: 'Système',
      light: 'Clair',
      dark: 'Sombre',

      icon: {
        label: 'Thème de l’icône',
        default: 'Par défaut',
        neon: 'Néon',
        sunset: 'Crépuscule',
        tanning: 'Bronzage',
      },
    },

    review: 'Laisser un avis sur l’application',
    faq: 'Questions fréquentes',
    terms: 'Conditions d’utilisation',
    privacyPolicy: 'Politique de confidentialité',
    updateHistory: 'Historique des mises à jour',
    quickInquiry: {
      label: 'Contact rapide',
      title: 'Demande / Signalement',
      confirm: 'Envoyer',
      placeholder: 'Saisis ta demande ou ton signalement',
      successTitle: 'Ta demande a bien été reçue',
      successBody: 'Nous l’examinerons et agirons dans les plus brefs délais.',
      error: 'Échec de l’envoi de ta demande. Réessaie dans un instant',
    },
    developerEmail: 'E-mail du développeur',
    emailCopied: 'E-mail copié',
    versionInfo: 'Informations de version',
    logout: {
      label: 'Se déconnecter',
      title: 'Veux-tu te déconnecter ?',
    },
  },

  friends: {
    label: 'Amis',
    allUsers: 'Tous les utilisateurs',
    delete: 'Supprimer l’ami',
    recieved: 'Demandes d’ami reçues',
    reRequest: 'Redemander',
    add: 'Ajouter un ami',

    requestModal: {
      title: 'Demande d’ami',
      body: 'Cette personne t’a envoyé une demande d’ami\nVeux-tu l’accepter ?',
    },

    noSameFriend: 'Aucun ami correspondant. Vérifie le nom ou l’identifiant',
    noFriend: 'Tu n’as pas encore d’amis. Ajoute-en d’abord',
    deleteConfirm: 'Supprimer {{displayName}} de ta liste d’amis ?',
    searchPlaceholder: 'Recherche par pseudo ou identifiant',
    inviteMessage: 'Des amis n’utilisent pas encore l’application ?\nInvite-les à jouer avec toi',

    team: {
      select: 'Choisir des amis',
      complete: 'Terminé',
      selectFriend: 'Choisis les amis avec qui jouer. Ceux que tu choisis s’afficheront ici.',
    },

    invite: {
      label: 'Inviter',
      title: 'Atteins tes objectifs avec tes amis sur Bingket !',
      description: 'Fixe tes objectifs sous forme de bingo et réalise-les avec la communauté',
      openApp: 'Ouvrir dans l’application',
    },

    error: {
      load: 'Impossible de charger la liste d’amis',
      invite: 'Échec du partage du lien d’invitation',
      request: 'Échec de la demande d’ami',
      search: 'Échec de la recherche',
      delete: 'Échec de la suppression de l’ami',
      usage: 'Le partage n’est pas disponible sur cet appareil',
    },
  },

  team: {
    title: 'Jouer avec des amis',
    create: {
      friend: {
        label: 'Inviter des amis',
        selected: '{{count}} sélectionné(s)',
        invite: 'Amis à inviter',
        description: 'Tu peux jouer avec {{count}} amis maximum',
      },
    },
    selection: {
      select: 'Choisir des amis',
      complete: 'Terminé',
      selectFriend: 'Choisis les amis avec qui jouer',
    },
    invite: {
      friendsBingo: 'Grille de bingo de {{userName}}',
      competitionMessage: '{{name}} veut te défier au bingo',
      togetherMessage: '{{name}} veut faire un bingo avec toi',
      period: 'Période : {{startDate}} ~ {{endDate}}',
      daysUntilEnd: 'Plus que {{days}} jour(s) avant la fin',
      daysUntilStart: 'On commence tous ensemble dans {{days}} jour(s)',
      currentMemberCount: '{{count}} personne(s) participent actuellement',
      composingDescription:
        'La période est celle choisie par la personne qui t’a invité(e). Tu n’as plus qu’à définir librement tes objectifs',
      reject: 'Refuser',
      rejectTitle: 'Refuser l’invitation ?',
      rejectBody: 'Si tu refuses, tu ne pourras pas rejoindre ce bingo d’équipe',
    },
    status: {
      pendingAccept: 'En attente d’acceptation',
      leaveTeamMenuItem: 'Quitter l’équipe',
      startCountdown:
        'On commence tous ensemble dans {{days}} jour(s). Tu pourras remplir les cases à partir de là',
      endedShared: 'Notre équipe a rempli {{checked}} cases sur {{total}} 👏',
      endedNoWinner: 'Le bingo d’équipe est terminé 👏',
      winner: '{{names}} est en 1re place ! 👑',
      participants: 'Participants',
      boardNotCreated: 'N’a pas encore créé\nde grille de bingo',
      boardLoadFailRefresh:
        'Impossible de charger la grille de bingo\nTire vers le bas pour actualiser',
      noBingo: 'Grille de bingo introuvable',
      noJoinedMembers:
        'Personne n’a encore rejoint\nLes membres apparaîtront ici dès qu’ils auront accepté l’invitation',
      retrospectiveTitle: 'Bilan',
      retrospectiveDescription:
        'Raconte comment s’est passée cette période pour toi. Les membres de l’équipe pourront aussi le voir',
      retrospectivePlaceholder: 'Laisse ton bilan',
      retrospectiveSaveFail: 'Impossible d’enregistrer ton bilan. Réessaie dans un instant',
      noOtherRetrospective: 'Aucun autre bilan pour le moment',
      sharedModeInfo:
        'La première personne qui touche une case en devient propriétaire, et seule cette personne peut décocher une case remplie',
      rankFrozenInfo: 'Le classement a été fixé selon le taux de réussite à la fin',
      rankInfo:
        'Le classement dépend du taux de réussite (cases remplies ÷ total des cases), ce qui reste équitable même si la taille des grilles diffère',
      periodEnded: 'Terminé',
      periodDaysUntilStart: 'Commence dans {{days}} jour(s)',
      howMany: '{{count}} personne(s)',
      periodDday: 'J-{{days}}',
    },
    mode: {
      shared: {
        label: 'Ensemble',
        description: 'Remplissez une même grille de bingo à plusieurs',
        guide:
          'Crée une seule grille de bingo et complétez-la ensemble avec tes amis\nSeul(e) moi, en tant qu’hôte, peux modifier le contenu des cases et le thème',
      },

      competition: {
        label: 'Défi',
        description: 'Chacun crée son bingo et vous vous affrontez',
        guide:
          'Chacun crée sa propre grille de bingo et vous vous affrontez\nUne fois les invitations envoyées, tes amis créent chacun leur bingo',
      },

      copied: {
        label: 'Mêmes objectifs',
        description: 'Commencez avec les mêmes objectifs et remplissez chacun votre grille',
        guide: 'Commencez avec les mêmes objectifs et remplissez chacun votre grille',
      },
    },

    alert: {
      fullBingo:
        'Tu pourras participer une fois ton bingo en cours terminé\nTu peux avoir jusqu’à {{count}} bingos en cours à la fois',
      fullTeammate: 'L’équipe est complète. Un bingo d’équipe accepte jusqu’à {{count}} personnes',
      needBingo:
        'Cette invitation te demande de créer ton propre bingo\nOuvre l’invitation pour participer',
      endedBingo: 'Ce bingo est déjà terminé',
      endedInvite: 'Cette invitation a été annulée ou est terminée',
      removedBingo: 'Tu ne peux pas participer : l’hôte a supprimé la grille de bingo',
      loadFail: 'Impossible de charger la grille de bingo',
      acceptFailed: 'Échec de l’acceptation',
    },

    error: {
      generate: 'Échec de la création du bingo d’équipe',
      load: 'Impossible de charger la grille de bingo de ton ami',
      loadInvite: 'Impossible de charger l’invitation',
      reject: 'Échec du refus',
      status: 'Impossible de charger les informations de l’équipe',
      info: 'Impossible de charger les informations de l’équipe',
      inviteMissing: 'Invitation introuvable',
      inviteExpired: 'Impossible d’accepter',
      inviteDeny: 'Impossible de refuser',
    },
    leaveModal: {
      title: 'Quitter l’équipe ?',
      bodyShare:
        'Les cases que tu as remplies restent telles quelles. Si tu es l’hôte, le rôle passe à la personne suivante.',
      bodySolo:
        'Ton bingo restera un bingo personnel et tu seras seulement retiré(e) du classement de l’équipe',
      fail: 'Échec de la sortie de l’équipe',
    },
  },

  update: {
    title: 'Mise à jour nécessaire',
    description: 'Tu dois passer à la nouvelle version\npour continuer à utiliser l’application',
    button: 'Mettre à jour',
  },

  badge: {
    get: 'Obtenu',
    loadError: 'Impossible de charger les badges',
    empty: 'Tu n’as encore obtenu aucun badge',
    more: 'D’autres badges arriveront bientôt',

    cell_1: {
      name: 'Premier pas',
      message: 'Tu as réalisé 10 cases de bingo ! 🎉',
    },
    cell_2: {
      name: 'Défi régulier',
      message: 'Tu as réalisé 30 cases de bingo ! 🎉',
    },
    cell_3: {
      name: 'Atteigneur d’objectifs',
      message: 'Tu as réalisé 50 cases de bingo ! 🎉',
    },
    cell_4: {
      name: 'Maître du bingo',
      message: 'Tu as réalisé 100 cases de bingo ! 🏆',
    },

    like_1: {
      name: 'Premier j’aime',
      message: 'Tu as donné ton premier j’aime ! 💙',
    },
    like_2: {
      name: 'Petit adepte des j’aime',
      message: 'Tu as donné 10 j’aime ! 💙',
    },
    like_3: {
      name: 'Boost de j’aime',
      message: 'Tu as donné 50 j’aime ! ❤️',
    },
    like_4: {
      name: 'Roi des j’aime',
      message: 'Tu as donné 100 j’aime ! ❤️',
    },

    comment_1: {
      name: 'Premier commentaire',
      message: 'Tu as écrit ton premier commentaire ! 💬',
    },
    comment_2: {
      name: 'Conteur',
      message: 'Tu as écrit 30 commentaires ! 💬',
    },
    comment_3: {
      name: 'Roi de la communication',
      message: 'Tu as écrit 50 commentaires ! 👑',
    },
    comment_4: {
      name: 'Maître des commentaires',
      message: 'Tu as écrit 100 commentaires ! 👑',
    },

    post_1: {
      name: 'Première publication',
      message: 'Tu as écrit ta première publication ! 📝',
    },
    post_2: {
      name: 'Membre actif',
      message: 'Tu as écrit 30 publications ! 📝',
    },
    post_3: {
      name: 'Star de la communauté',
      message: 'Tu as écrit 50 publications ! ⭐',
    },
    post_4: {
      name: 'Auteur de légende',
      message: 'Tu as écrit 80 publications ! 🏆',
    },

    notification: '🏅 Nouveau badge obtenu ! {{name}} - {{message}}',
  },
};
