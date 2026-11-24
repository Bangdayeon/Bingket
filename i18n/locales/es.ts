export default {
  postWritingNotice: {
    line1: 'Evita contenido que pueda ofender o perjudicar a otras personas',
    line2:
      'No se permiten publicaciones con insultos, groserías, información falsa u otros contenidos dañinos para los demás',
    line3: 'Escribe con respeto para que todos podamos comunicarnos a gusto',
    line4:
      'El contenido que vulnere los derechos de otras personas o resulte ofensivo puede eliminarse sin previo aviso',
  },
  common: {
    screen: {
      home: 'Inicio',
      board: 'Foro',
      notifications: 'Notificaciones',
      mypage: 'Mi espacio',
    },
    date: 'AAAA.MM.DD',

    bingo: {
      bingo: 'Bingo',
      achieve: 'Logrado',
      achieveDate: 'Fecha de logro',
      endDate: 'Fecha de fin',
      emptyBingo: 'Este bingo no se puede ver.',
      memoPlaceholder: 'Escribe una nota.',
    },

    field: {
      email: 'Correo electrónico',
      password: 'Contraseña',
    },

    visibility: {
      label: 'Visibilidad del bingo',
      public: 'Público',
      public_des: 'Cualquiera puede ver tu bingo',
      friends: 'Solo amigos',
      friends_des: 'Solo tus amigos pueden ver tu bingo',
      private: 'Privado',
      private_des: 'Solo tú puedes ver tu bingo',
    },

    // Actions
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    next: 'Siguiente',
    previous: 'Anterior',
    start: 'Empezar',
    select: 'Seleccionar',

    retry: 'Reintentar',
    editFail: 'No se pudo cambiar',

    // Navigation / UI
    more: 'Ver más',
    save: 'Guardar',
    unsaved: {
      title: 'Tienes cambios sin guardar',
      body: 'Si sales ahora, no se guardarán los cambios',
      cancel: 'Seguir editando',
      confirm: 'Salir',
    },
    // States
    noSearchResult: 'No hay resultados',
    offline: 'Estás sin conexión · Se actualizará automáticamente cuando te conectes',

    error: {
      imageUpload: 'No se pudo subir la imagen',
      save: 'No se pudo guardar',
      general: 'Ocurrió un error',
      retry: 'Inténtalo de nuevo en unos momentos',
      unknown: 'Ocurrió un error desconocido',
      network: 'Ocurrió un error de red',
    },

    // Bingo status labels
    stateDraft: 'En creación',
    stateProgress: 'En curso',
    stateDone: 'Completado',

    permission: {
      cameraTitle: 'Se necesita permiso para la cámara',
      cameraBody: 'Permite el acceso a la cámara en Ajustes',
      albumTitle: 'Se necesita permiso para la galería',
      albumBody: 'Permite el acceso a las fotos en Ajustes',
    },

    limitPlaceholder: 'Escribe hasta {{count}} caracteres',
  },

  onboarding: {
    msg1: 'Llena el tablero de bingo con\nmetas que te costaba cumplir',
    msg2: 'Si solo no encuentras motivación,\nhazlo con amigos y familia',
    msg3: 'Comparte tus metas con otros\ny apoya sus desafíos',
    msg4: 'Cumple tus metas paso a paso\ny colecciona insignias',
    msg5: 'Tus propios desafíos en un bingo,\nempieza en Bingket',
  },

  auth: {
    apple: 'Apple',
    google: 'Google',
    kakao: 'Kakao',
    email: 'Correo electrónico',

    needLogin: 'Necesitas iniciar sesión',

    startWith: {
      apple: 'Empezar con Apple',
      google: 'Empezar con Google',
      email: 'Empezar con correo electrónico',
      kakao: 'Empezar con Kakao',
    },

    field: {
      email: 'Correo electrónico',
      password: 'Contraseña',
      passwordConfirm: 'Confirmar contraseña',
    },

    placeholder: {
      email: 'Escribe tu correo electrónico',
      password: 'Mínimo 8 caracteres con letras, números y símbolos',
      passwordConfirm: 'Vuelve a escribir tu contraseña',
    },

    validation: {
      invalidEmail: 'Escribe un correo electrónico válido',
      invalidPassword: 'La contraseña debe tener al menos 8 caracteres',
      missingPassword: 'Escribe tu contraseña',
      missingPasswordConfirm: 'Confirma tu contraseña',
      passwordMismatch: 'Las contraseñas no coinciden',
      alreadyRegistered: 'Este correo electrónico ya está registrado',
    },

    login: {
      failed: 'No se pudo iniciar sesión',
      required: 'Necesitas iniciar sesión',
    },

    agreement: {
      title: 'Aceptaciones obligatorias para usar el servicio',
      all: 'Aceptar todo',
      term: 'Acepto los Términos de uso',
      privacy: 'Acepto la recopilación y el uso de datos personales',
      over14: 'Tengo 14 años o más',
    },

    continue: 'Continuar',
  },

  bingo: {
    label: 'Bingo',
    board: 'Tablero de bingo',
    user: 'Usuario de bingo',
    empty: 'Este bingo no se puede ver',
    visibility: {
      label: 'Visibilidad del bingo',
      public: 'Público',
      publicDescription: 'Cualquiera puede ver tu bingo',
      friends: 'Solo amigos',
      friendsDescription: 'Solo tus amigos pueden ver tu bingo',
      private: 'Privado',
      privateDescription: 'Solo tú puedes ver tu bingo',
    },

    doneDate: 'Fecha de finalización',
    achievedDate: 'Fecha de logro',
    stat: {
      achievement: 'Logrado',
      bingo: 'Bingo',
      endDate: 'Fecha de fin',
    },

    cellGrid: {
      label: 'Cantidad de casillas',
      hint: 'No se puede cambiar después de guardar',
      description: 'Las diagonales de 3 casillas también cuentan como bingo',
    },

    modifyCount: {
      label: 'Ediciones por casilla',
      none: 'Sin ediciones',
      count: '{{count}} vez/veces',
      infinite: 'Ilimitadas',
      hint: 'No se puede cambiar después de guardar',
    },

    cell: {
      label: 'Escribe tu bingo',
      hint: 'Toca cada casilla para llenar tu bingo',
      placeholder: 'Hasta 30 caracteres',
    },

    error: {
      bingoSave: 'No se pudo guardar el tablero de bingo',
      create: 'No se pudo crear el bingo',
    },

    competition: {
      alreadyTitle: 'Esta casilla ya está llena',
      alreadyBody: '¡Llegaste tarde! Otro integrante del equipo ya llenó esta casilla',
      my: 'La llené yo',
      nobody: 'Miembro que se fue',
      other: ' la llenó',
    },

    memo: {
      placeholder: 'Escribe una nota',
      saved: 'Guardado',
      saveFailed: 'No se pudo guardar',
    },

    theme: {
      default: 'Predeterminado',
      rabbit: 'Conejo',
      redHorse: 'Caballo rojo',
      squareCat: 'Gato cuadrado',
      pig: 'Cerdito',
      midnight: 'Medianoche',
    },
  },

  invite: {
    error: {
      missing: 'No se encontró la invitación.',
      expired: 'No se pudo aceptar.',
      deny: 'No se pudo rechazar.',
    },
  },

  home: {
    empty: 'Aún no tienes ningún bingo\n¿Creamos el primero?',
    // Add bingo section
    addBingo: {
      default: 'Agregar bingo',
      friends: 'Jugar con amigos',
      myself: 'Jugar solo',
      clean: 'Primero ordena tus bingos',
      cleanDescription: 'Puedes tener hasta {{count}} bingos en curso a la vez',
    },

    // invite: 'Invitar',
    memo: 'Nota',
    memoEdit: 'Editar nota',
    memoPlaceholder: 'Escribe una nota',
    modifyBingo: 'Editar bingo',
    lastModify: 'Última edición',

    btnLabel: {
      temporarySave: 'Guardar borrador',
      add: 'Agregar',
      creating: 'Creando...',
      processing: 'Procesando...',
      startBingoWith: 'Enviar invitaciones',
    },

    field: {
      title: {
        word: 'Título',
        label: 'Escribe un título',
      },

      duration: {
        word: 'Período de la meta',
        label: 'Selecciona el período de la meta',
        oneMonth: '1 mes',
        threeMonths: '3 meses',
        sixMonths: '6 meses',
        oneYear: '1 año',
        custom: 'Personalizado',
        startDate: 'Fecha de inicio',
        endDate: 'Fecha de fin',
        selectStartDate: 'Selecciona la fecha de inicio',
        selectEndDate: 'Selecciona la fecha de fin',
      },

      selectTheme: 'Tema',
      modifyCount: {
        label: 'Ediciones permitidas del bingo',
        infinite: 'Ilimitadas',
      },

      bet: {
        label: 'Apuesta',
      },
      reward: {
        label: 'Recompensa por lograrlo',
      },

      friend: {
        label: 'Elegir amigos',
        selected: '{{count}} seleccionado(s)',
        invite: 'Amigos a invitar',
        description: 'Puedes jugar con hasta {{count}} amigos.',
      },
    },
    alert: {
      fillAllCells: 'Llena todas las casillas del bingo',
      selectFriends: 'Elige al menos un amigo para jugar juntos',
    },

    error: {
      save: 'No se pudo guardar',
      delete: 'No se pudo eliminar',
      load: 'No se pudo cargar el bingo',
      loadInvite: 'No se pudo cargar la invitación.',
      reject: 'No se pudo rechazar.',
      teamStatus: 'No se puede cargar la información del equipo.',
      teamInfoLoad: 'No se pudo cargar la información del equipo.',
    },

    // Sentences
    temporarySaved: 'Se guardó como borrador\nPuedes continuar desde la pantalla de inicio',
    deleteConfirm: '¿Seguro que quieres eliminar este bingo?',
    deleteBody: 'Un bingo eliminado no se puede recuperar',

    // Team invitations
    inviteCompetitionMessage: '{{name}} quiere competir contigo en un bingo',
    inviteTogetherMessage: '{{name}} quiere hacer un bingo contigo',
    period: 'Período: {{startDate}} ~ {{endDate}}',
    daysUntilEnd: 'Faltan {{days}} día(s) para la fecha de fin',
    daysUntilStart: 'Empezamos todos juntos en {{days}} día(s)',
    currentMemberCount: 'Ahora participan {{count}} persona(s)',
    composingDescription:
      'El período es el que definió quien te invitó. Solo tienes que elegir tus metas libremente.',
    rejectInvite: 'Rechazar',
    rejectInviteTitle: '¿Rechazar la invitación?',
    rejectInviteBody: 'Si rechazas, no podrás unirte a este bingo en equipo.',

    // Save confirmation modal
    modal: {
      save: {
        title: 'Crear bingo',
        body: 'El período de la meta, la cantidad de casillas y las ediciones permitidas\nno se pueden cambiar después de guardar\n¿Crear el bingo así?',
        cancel: 'Revisar otra vez',
        confirm: 'Crear bingo',
      },
      friend: {
        title:
          'El período y el contenido de las casillas no se pueden cambiar después de crearlo\n¿Enviar invitaciones a {{count}} amigo(s)?',
        cancel: 'Revisar otra vez',
        confirm: 'Enviar invitaciones',
      },
      leaveTeam: {
        title: '¿Salir del equipo?',
        body_share:
          'Las casillas que llenaste se quedan como están. Si eres el anfitrión, el rol pasa a la siguiente persona.',
        body_solo: 'Tu bingo quedará como bingo personal. Solo saldrás del ranking del equipo.',
        fail: 'No se pudo salir del equipo.',
      },
    },
    saveConfirmTitle: 'Crear bingo',
    saveConfirmCancel: 'Revisar otra vez',
    okAndCreate: 'Aceptar y crear bingo',
    doWith: 'Unirme',

    // Team status screen (TeamStatusScreen)
    pendingAccept: 'Pendiente de aceptar',
    leaveTeamMenuItem: 'Salir del equipo',

    teamStartCountdown:
      'Empezamos todos juntos en {{days}} día(s). Desde ese momento podrás llenar las casillas.',
    teamEndedShared: 'Nuestro equipo llenó {{checked}} de {{total}} casillas 👏',
    teamEndedNoWinner: 'El bingo en equipo terminó 👏',
    teamWinner: '¡{{names}} quedó en 1.er lugar! 👑',
    participants: 'Participantes',
    boardNotCreated: 'Aún no ha creado\nsu tablero de bingo',
    boardLoadFailRefresh:
      'No se pudo cargar el tablero de bingo\nDesliza hacia abajo para actualizar',
    noBingo: 'No se encontró el tablero de bingo.',
    noJoinedMembers: 'Aún no se ha unido nadie\nAparecerán aquí cuando acepten la invitación',
    retrospectiveTitle: 'Reflexión',
    retrospectiveDescription:
      'Cuenta cómo fue este período para ti. Tus compañeros de equipo también podrán verlo.',
    retrospectivePlaceholder: 'Deja tu reflexión.',
    retrospectiveSaveFail: 'No se pudo guardar tu reflexión. Inténtalo de nuevo en unos momentos.',
    noOtherRetrospective: 'Aún no hay reflexiones de otras personas',
    sharedModeInfo:
      'Quien toque primero una casilla se convierte en su dueño. Solo esa persona puede desmarcar una casilla llena.',
    rankFrozenInfo: 'El ranking quedó definido según el porcentaje de logro al finalizar.',
    rankInfo:
      'El ranking se define por el porcentaje de logro (casillas llenas ÷ casillas totales). Es justo aunque los tableros tengan distinto tamaño.',

    periodEnded: 'Finalizado',
    periodDaysUntilStart: 'Empieza en {{days}} día(s)',
    howmany: '{{count}} persona(s)',
    periodDday: 'Faltan {{days}} d',
  },

  board: {
    author: 'Autor',
    anonymous: 'Anónimo',
    unknown: '(Desconocido)',
    submit: 'Publicar',
    badWord: 'Usaste una expresión inapropiada',

    timeAgo: {
      justNow: 'Justo ahora',
      minutesAgo: 'Hace {{count}} min',
      hoursAgo: 'Hace {{count}} h',
      daysAgo: 'Hace {{count}} día(s)',
      monthsAgo: 'Hace {{count}} mes(es)',
    },

    post: {
      empty: 'Aún no hay publicaciones\nEscribe la primera',
      create: {
        title: 'Escribir publicación',
        error: 'No se pudo crear la publicación',
      },

      edit: {
        menu: 'Editar',
        title: 'Editar publicación',
        error: 'No se pudo editar la publicación',
      },

      delete: {
        menu: 'Eliminar',
        title: '¿Eliminar la publicación?',
        body: 'Una publicación eliminada no se puede recuperar',
        error: 'No se pudo eliminar la publicación',
      },

      form: {
        contentPlaceholder: 'Escribe el contenido',
      },

      attachment: {
        loadBingo: 'Cargar bingo',
        takePhoto: 'Tomar una foto',
        pickFromAlbum: 'Elegir de la galería',
      },

      bingo: {
        empty: 'No hay bingos',
        create: 'Crear bingo',
        loadError: 'No se pudo cargar la lista de bingos',
      },

      error: {
        notFound: 'No se encontró la publicación',
        like: 'No se pudo registrar el me gusta. Inténtalo de nuevo en unos momentos',
      },
    },

    comment: {
      first: 'Deja el primer comentario',
      placeholder: 'Escribe un comentario',
      warning: 'El contenido inapropiado puede ser sancionado',
      writingTo: 'Respondiendo a {{author}}',
      more: 'Ver más comentarios',

      delete: {
        title: '¿Eliminar el comentario?',
        deleted: 'Este comentario fue eliminado',
        description: 'Un comentario eliminado no se puede recuperar',
      },

      error: {
        load: 'No se pudieron cargar los comentarios',
        create: 'No se pudo publicar el comentario',
        delete: 'No se pudo eliminar el comentario',
      },
    },

    moderation: {
      report: {
        menu: 'Denunciar',
        explanation:
          'Los usuarios con 3 o más denuncias acumuladas pueden tener restricciones en la comunidad',
        confirm: 'Denunciar',

        reason: {
          ad: 'Publicidad y ventas comerciales',
          abuse: 'Insultos/humillaciones',
          sexual: 'Contenido obsceno/sexual',
          spam: 'Spam',
          impersonation: 'Suplantación/fraude',
          other: 'Otro',
        },

        success: {
          title: 'Denuncia enviada',
          body: 'Actuaremos sobre tu denuncia en un plazo de 24 horas',
        },

        error: 'No se pudo enviar la denuncia',
      },

      block: {
        menu: 'Bloquear',
        body: '¿Quieres bloquear a este usuario?\nNo verás sus publicaciones ni comentarios',
        confirm: 'Bloquear',

        success: {
          title: 'Bloqueaste a este usuario',
          body: 'Ya no verás las publicaciones ni los comentarios de este usuario',
        },

        error: 'No se pudo bloquear',
      },
    },

    search: {
      placeholder: 'Buscar en títulos · contenido · comentarios',
      recent: 'Búsquedas recientes',
      deleteAll: 'Borrar todo',
      empty: 'No hay búsquedas recientes',
      error: 'No se pudo buscar',
    },
  },

  notifications: {
    setAllRead: 'Marcar todo como leído',
    empty: 'No hay notificaciones nuevas',
    more: 'Ver más notificaciones',

    title: {
      default: 'Nueva notificación',
      bingoReminder: 'Queda poco para el plazo',
      bingoDday: 'El plazo termina mañana',
      teamInvite: 'Recibiste una invitación a un bingo',
      teamFinished: 'El bingo terminó',
      comment: 'Tu publicación tiene un nuevo comentario',
      reply: 'Tu publicación tiene un nuevo comentario',
      like: 'Tu publicación recibió un me gusta',
      friendRequest: 'Recibiste una solicitud de amistad',
      teamJoined: 'Alguien se unió al equipo',
      teamInviteDeclined: 'Alguien rechazó unirse',
      teamCellChecked: 'Un compañero llenó una casilla',
      badge: 'Obtuviste una nueva insignia',
      popular: 'Tu publicación se volvió popular',
    },

    time: {
      justNow: 'Justo ahora',
      minutesAgo: 'Hace {{count}} min',
      hoursAgo: 'Hace {{count}} h',
      daysAgo: 'Hace {{count}} día(s)',
    },

    action: {
      confirm: 'Aceptar',
      confirm_short: 'Aceptar',
      deny: 'Rechazar',
      deny_short: 'Rechazar',
      checkInvite: 'Ver invitación',
      checkTeamStatus: 'Ver estado del equipo',
    },

    error: 'No se pudieron cargar las notificaciones',
  },

  my: {
    feed: 'Feed',
    badge: 'Insignias',

    post: {
      title: 'Publicaciones',
      empty: 'Aún no has escrito publicaciones',
      emptyBtn: 'Explorar el foro',
    },
  },

  profile: {
    feedEmpty: 'El feed está vacío',
    visible: {
      friend: 'Solo los amigos pueden verlo',
      friendDescription: 'Hazte amigo para ver sus bingos e insignias',
      locked: 'Es una cuenta privada',
      lockedDescription: 'Esta cuenta no muestra sus bingos ni insignias',
    },

    beFriend: {
      require: 'Solicitar amistad',
      required: 'Solicitud de amistad enviada',
    },

    error: {
      loadProfile: 'No se pudo cargar el perfil',
      friendRequire: 'No se pudo enviar la solicitud de amistad',
      notFound: 'Usuario no encontrado',
    },
  },

  settings: {
    label: 'Ajustes',
    closeMenu: 'Cerrar menú',
    profile: {
      label: 'Editar perfil',

      image: {
        label: 'Foto de perfil',
        camera: 'Cámara',
        album: 'Elegir de la galería',
        default: 'Usar imagen predeterminada',
      },

      nickname: {
        label: 'Apodo',
        placeholder: 'Escribe hasta {{count}} caracteres',
        mixture: 'Solo se permiten combinaciones de hangul, letras en inglés y números',
        error: 'Escribe un apodo',
      },

      id: {
        label: 'ID',
        placeholder:
          'Hasta {{count}} caracteres, solo letras en inglés, guion bajo, guion y números',
        mixture: 'Solo se permiten combinaciones de letras en inglés, números, _ y -',
        error: 'Escribe un ID',
      },
      bio: {
        label: 'Propósito en una línea',
        edit: 'Editar propósito en una línea',
        empty: 'Aún no tienes un propósito en una línea',
        placeholder: 'Escribe hasta {{count}} caracteres',
      },
    },

    account: {
      label: 'Administrar cuenta',
      linkedInfo: 'Información de cuentas vinculadas',
      linkedInfoFail: 'No se pudieron cargar las cuentas vinculadas',
      linkedInfoEmpty: 'No hay cuentas vinculadas',

      visibility: 'Visibilidad de la cuenta',
      public: 'Público',
      publicDescription:
        'Cualquiera puede ver los bingos que escribiste y tu cuenta aparece en las búsquedas',
      friends: 'Solo amigos',
      friendsDescription:
        'Solo tus amigos pueden ver los bingos que escribiste y tu cuenta aparece en las búsquedas',
      private: 'Privado',
      privateDescription:
        'Solo tú puedes ver los bingos que escribiste y tu cuenta no aparece en las búsquedas',
      visibilityChangeFail: 'No se pudo cambiar la visibilidad',

      reset: {
        label: 'Restablecer bingos',
        title: '¿Seguro que quieres restablecer tus bingos?',
        body: '• Se eliminarán todos los bingos que creaste\n• Tus publicaciones y comentarios se conservan\n• Tu cuenta y tu perfil se mantienen',
        confirm: 'Restablecer',
        doneTitle: 'Restablecimiento completo',
        doneBody: 'Se eliminaron todos los bingos',
      },

      withdraw: {
        label: 'Eliminar cuenta',
        title: '¿Seguro que quieres eliminar tu cuenta?',
        body: '• Se eliminarán tu cuenta, la información de tu perfil y tu foto de perfil\n• Los datos no se pueden recuperar después de eliminar la cuenta\n• Tus publicaciones y comentarios se conservarán como (Desconocido), junto con las fotos adjuntas',
        confirm: 'Eliminar cuenta',
      },
    },

    notifications: {
      label: 'Ajustes de notificaciones',

      blockTitle: 'Las notificaciones del dispositivo están desactivadas',
      blockBody:
        'No recibirás notificaciones sin importar los ajustes de abajo. Activa las notificaciones push de la app en los ajustes de tu dispositivo. >',

      bingo: {
        label: 'Bingo',
        deadline: 'Avisos de plazo próximo',
      },
      team: {
        label: 'Bingo en equipo',
        teamAction: 'Avisos de actividad del equipo',
      },
      board: {
        label: 'Foro',
        comment: 'Avisos de comentarios',
        like: 'Avisos de me gusta',
      },

      error: {
        save: 'No se pudieron guardar los ajustes de notificaciones',
        load: 'No se pudieron cargar los ajustes de notificaciones',
      },
    },

    theme: {
      label: 'Tema de la app',
      system: 'Sistema',
      light: 'Claro',
      dark: 'Oscuro',

      icon: {
        label: 'Tema del ícono',
        default: 'Predeterminado',
        neon: 'Neón',
        sunset: 'Atardecer',
        tanning: 'Bronceado',
      },
    },

    review: 'Dejar una reseña de la app',
    faq: 'Preguntas frecuentes',
    terms: 'Términos de uso',
    privacyPolicy: 'Política de privacidad',
    updateHistory: 'Historial de actualizaciones',
    quickInquiry: {
      label: 'Consulta rápida',
      title: 'Consulta / Denuncia',
      confirm: 'Enviar',
      placeholder: 'Escribe tu consulta o denuncia',
      successTitle: 'Recibimos tu consulta',
      successBody: 'La revisaremos y actuaremos lo antes posible.',
      error: 'No se pudo enviar tu consulta. Inténtalo de nuevo en unos momentos',
    },
    developerEmail: 'Correo del desarrollador',
    emailCopied: 'Correo electrónico copiado',
    versionInfo: 'Información de la versión',
    logout: {
      label: 'Cerrar sesión',
      title: '¿Quieres cerrar sesión?',
    },
  },

  friends: {
    label: 'Amigos',
    allUsers: 'Todos los usuarios',
    delete: 'Eliminar amigo',
    recieved: 'Solicitudes de amistad recibidas',
    reRequest: 'Volver a solicitar',
    add: 'Agregar amigo',

    requestModal: {
      title: 'Solicitud de amistad',
      body: 'Esta persona te envió una solicitud de amistad\n¿Quieres aceptarla?',
    },

    noSameFriend: 'No hay amigos que coincidan. Revisa el nombre o el ID',
    noFriend: 'Aún no tienes amigos. Agrega algunos primero',
    deleteConfirm: '¿Eliminar a {{displayName}} de tu lista de amigos?',
    searchPlaceholder: 'Busca por apodo o ID',
    inviteMessage: '¿Tienes amigos que aún no usan la app?\nInvítalos para jugar juntos',

    team: {
      select: 'Elegir amigos',
      complete: 'Listo',
      selectFriend: 'Elige a los amigos con quienes jugar. Los que elijas aparecerán aquí.',
    },

    invite: {
      label: 'Invitar',
      title: '¡Cumple tus metas con tus amigos en Bingket!',
      description: 'Plantea tus metas en formato de bingo y cúmplelas junto a la comunidad',
      openApp: 'Abrir en la app',
    },

    error: {
      load: 'No se pudo cargar la lista de amigos',
      invite: 'No se pudo compartir el enlace de invitación',
      request: 'No se pudo enviar la solicitud de amistad',
      search: 'No se pudo buscar',
      delete: 'No se pudo eliminar al amigo',
      usage: 'No se puede usar el menú de compartir en este dispositivo',
    },
  },

  team: {
    title: 'Jugar con amigos',
    create: {
      friend: {
        label: 'Invitar amigos',
        selected: '{{count}} seleccionado(s)',
        invite: 'Amigos a invitar',
        description: 'Puedes jugar con hasta {{count}} amigos',
      },
    },
    selection: {
      select: 'Elegir amigos',
      complete: 'Listo',
      selectFriend: 'Elige a los amigos con quienes jugar',
    },
    invite: {
      friendsBingo: 'Tablero de bingo de {{userName}}',
      competitionMessage: '{{name}} quiere competir contigo en un bingo',
      togetherMessage: '{{name}} quiere hacer un bingo contigo',
      period: 'Período: {{startDate}} ~ {{endDate}}',
      daysUntilEnd: 'Faltan {{days}} día(s) para la fecha de fin',
      daysUntilStart: 'Empezamos todos juntos en {{days}} día(s)',
      currentMemberCount: 'Ahora participan {{count}} persona(s)',
      composingDescription:
        'El período es el que definió quien te invitó. Solo tienes que elegir tus metas libremente',
      reject: 'Rechazar',
      rejectTitle: '¿Rechazar la invitación?',
      rejectBody: 'Si rechazas, no podrás unirte a este bingo en equipo',
    },
    status: {
      pendingAccept: 'Pendiente de aceptar',
      leaveTeamMenuItem: 'Salir del equipo',
      startCountdown:
        'Empezamos todos juntos en {{days}} día(s). Desde ese momento podrás llenar las casillas',
      endedShared: 'Nuestro equipo llenó {{checked}} de {{total}} casillas 👏',
      endedNoWinner: 'El bingo en equipo terminó 👏',
      winner: '¡{{names}} quedó en 1.er lugar! 👑',
      participants: 'Participantes',
      boardNotCreated: 'Aún no ha creado\nsu tablero de bingo',
      boardLoadFailRefresh:
        'No se pudo cargar el tablero de bingo\nDesliza hacia abajo para actualizar',
      noBingo: 'No se encontró el tablero de bingo',
      noJoinedMembers: 'Aún no se ha unido nadie\nAparecerán aquí cuando acepten la invitación',
      retrospectiveTitle: 'Reflexión',
      retrospectiveDescription:
        'Cuenta cómo fue este período para ti. Tus compañeros de equipo también podrán verlo',
      retrospectivePlaceholder: 'Deja tu reflexión',
      retrospectiveSaveFail: 'No se pudo guardar tu reflexión. Inténtalo de nuevo en unos momentos',
      noOtherRetrospective: 'Aún no hay reflexiones de otras personas',
      sharedModeInfo:
        'Quien toque primero una casilla se convierte en su dueño, y solo esa persona puede desmarcar una casilla llena',
      rankFrozenInfo: 'El ranking quedó definido según el porcentaje de logro al finalizar',
      rankInfo:
        'El ranking se define por el porcentaje de logro (casillas llenas ÷ casillas totales), por lo que es justo aunque los tableros tengan distinto tamaño',
      periodEnded: 'Finalizado',
      periodDaysUntilStart: 'Empieza en {{days}} día(s)',
      howMany: '{{count}} persona(s)',
      periodDday: 'D-{{days}}',
    },
    mode: {
      shared: {
        label: 'Juntos',
        description: 'Llenen un mismo tablero de bingo entre todos',
        guide:
          'Escribe un solo tablero de bingo y complétalo junto a tus amigos\nSolo yo, como anfitrión, puedo editar el contenido de las casillas y el tema',
      },

      competition: {
        label: 'Competir',
        description: 'Cada quien escribe su bingo y compiten',
        guide:
          'Cada quien escribe su propio tablero de bingo y compiten\nCuando envíes las invitaciones, tus amigos escribirán sus propios bingos',
      },

      copied: {
        label: 'Con las mismas metas',
        description: 'Empiezan con las mismas metas y cada quien llena su propio tablero',
        guide: 'Empiezan con las mismas metas y cada quien llena su propio tablero',
      },
    },

    alert: {
      fullBingo:
        'Podrás unirte cuando termines un bingo en curso\nPuedes tener hasta {{count}} bingos en curso a la vez',
      fullTeammate: 'El equipo está completo. Un bingo en equipo admite hasta {{count}} personas',
      needBingo:
        'Esta invitación requiere que crees tu propio bingo\nAbre la invitación para unirte',
      endedBingo: 'Este bingo ya terminó',
      endedInvite: 'Esta invitación fue cancelada o ya terminó',
      removedBingo: 'No puedes unirte porque el anfitrión eliminó el tablero de bingo',
      loadFail: 'No se pudo cargar el tablero de bingo',
      acceptFailed: 'No se pudo aceptar',
    },

    error: {
      generate: 'No se pudo crear el bingo en equipo',
      load: 'No se pudo cargar el tablero de bingo de tu amigo',
      loadInvite: 'No se pudo cargar la invitación',
      reject: 'No se pudo rechazar',
      status: 'No se puede cargar la información del equipo',
      info: 'No se pudo cargar la información del equipo',
      inviteMissing: 'No se encontró la invitación',
      inviteExpired: 'No se pudo aceptar',
      inviteDeny: 'No se pudo rechazar',
    },
    leaveModal: {
      title: '¿Salir del equipo?',
      bodyShare:
        'Las casillas que llenaste se quedan como están. Si eres el anfitrión, el rol pasa a la siguiente persona.',
      bodySolo: 'Tu bingo quedará como bingo personal y solo saldrás del ranking del equipo',
      fail: 'No se pudo salir del equipo',
    },
  },

  update: {
    title: 'Se necesita una actualización',
    description: 'Debes actualizar a la nueva versión\npara seguir usando la app',
    button: 'Ir a actualizar',
  },

  badge: {
    get: 'Obtenida',
    loadError: 'No se pudieron cargar las insignias',
    empty: 'Aún no has obtenido insignias',
    more: 'Pronto se agregarán más insignias',

    cell_1: {
      name: 'Primer paso',
      message: '¡Lograste 10 casillas de bingo! 🎉',
    },
    cell_2: {
      name: 'Reto constante',
      message: '¡Lograste 30 casillas de bingo! 🎉',
    },
    cell_3: {
      name: 'Cumplidor de metas',
      message: '¡Lograste 50 casillas de bingo! 🎉',
    },
    cell_4: {
      name: 'Maestro del bingo',
      message: '¡Lograste 100 casillas de bingo! 🏆',
    },

    like_1: {
      name: 'Primer me gusta',
      message: '¡Diste tu primer me gusta! 💙',
    },
    like_2: {
      name: 'Amante de los me gusta',
      message: '¡Diste 10 me gusta! 💙',
    },
    like_3: {
      name: 'Impulso de me gusta',
      message: '¡Diste 50 me gusta! ❤️',
    },
    like_4: {
      name: 'Rey de los me gusta',
      message: '¡Diste 100 me gusta! ❤️',
    },

    comment_1: {
      name: 'Primer comentario',
      message: '¡Escribiste tu primer comentario! 💬',
    },
    comment_2: {
      name: 'Cuentacuentos',
      message: '¡Escribiste 30 comentarios! 💬',
    },
    comment_3: {
      name: 'Rey de la comunicación',
      message: '¡Escribiste 50 comentarios! 👑',
    },
    comment_4: {
      name: 'Maestro de los comentarios',
      message: '¡Escribiste 100 comentarios! 👑',
    },

    post_1: {
      name: 'Primera publicación',
      message: '¡Escribiste tu primera publicación! 📝',
    },
    post_2: {
      name: 'Miembro activo',
      message: '¡Escribiste 30 publicaciones! 📝',
    },
    post_3: {
      name: 'Estrella de la comunidad',
      message: '¡Escribiste 50 publicaciones! ⭐',
    },
    post_4: {
      name: 'Escritor legendario',
      message: '¡Escribiste 80 publicaciones! 🏆',
    },

    notification: '🏅 ¡Nueva insignia! {{name}} - {{message}}',
  },
};
