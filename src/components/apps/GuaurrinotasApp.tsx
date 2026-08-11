"use client";

import { useState } from "react";

type FeedView = "inicio" | "siguiendo" | "perfil";

type PetProfile = {
  petName: string;
  username: string;
  avatar: string;
  bio: string;
  location: string;
  joined: string;
  followers: number;
  following: number;
  isFollowing: boolean;
  isCurrentUser: boolean;
};

type NoteComment = {
  id: number;
  petName: string;
  username: string;
  avatar: string;
  message: string;
  time: string;
};

type Note = {
  id: number;
  petName: string;
  username: string;
  avatar: string;
  message: string;
  time: string;
  likes: number;
  liked: boolean;
  comments: NoteComment[];
};

const currentUsername = "@robbie.guaurritas";

const initialProfiles: PetProfile[] = [
  {
    petName: "Robbie",
    username: "@robbie.guaurritas",
    avatar: "🐶",
    bio: "Experto en GuaurriCookies, paseos largos y hacer amigos en cualquier lugar.",
    location: "León, Guanajuato",
    joined: "Desde 2024",
    followers: 128,
    following: 44,
    isFollowing: false,
    isCurrentUser: true,
  },
  {
    petName: "Milo",
    username: "@miloexplora",
    avatar: "🐕",
    bio: "Explorador profesional de parques, rutas nuevas y olores importantes.",
    location: "León, Guanajuato",
    joined: "Desde 2025",
    followers: 86,
    following: 31,
    isFollowing: true,
    isCurrentUser: false,
  },
  {
    petName: "Nina",
    username: "@ninalacuriosa",
    avatar: "🐾",
    bio: "Defensora oficial de las siestas, los sillones y los planes tranquilos.",
    location: "Guanajuato, México",
    joined: "Desde 2025",
    followers: 59,
    following: 22,
    isFollowing: false,
    isCurrentUser: false,
  },
];

const initialNotes: Note[] = [
  {
    id: 1,
    petName: "Robbie",
    username: "@robbie.guaurritas",
    avatar: "🐶",
    message:
      "Hoy fui por mis GuaurriCookies y terminé saludando a todo el mundo. Día productivo.",
    time: "Hace 12 min",
    likes: 24,
    liked: false,
    comments: [
      {
        id: 101,
        petName: "Milo",
        username: "@miloexplora",
        avatar: "🐕",
        message: "Confirmo: Robbie saludó hasta al repartidor.",
        time: "Hace 8 min",
      },
      {
        id: 102,
        petName: "Nina",
        username: "@ninalacuriosa",
        avatar: "🐾",
        message: "Un verdadero experto en relaciones públicas.",
        time: "Hace 4 min",
      },
    ],
  },
  {
    id: 2,
    petName: "Milo",
    username: "@miloexplora",
    avatar: "🐕",
    message:
      "Encontré una ruta nueva para caminar. Tiene árboles, sombra y muchos olores importantes.",
    time: "Hace 38 min",
    likes: 17,
    liked: false,
    comments: [
      {
        id: 201,
        petName: "Robbie",
        username: "@robbie.guaurritas",
        avatar: "🐶",
        message: "Necesito la ubicación para una investigación.",
        time: "Hace 20 min",
      },
    ],
  },
  {
    id: 3,
    petName: "Nina",
    username: "@ninalacuriosa",
    avatar: "🐾",
    message:
      "Recordatorio amistoso: compartir el sillón también cuenta como actividad en familia.",
    time: "Hace 1 h",
    likes: 31,
    liked: false,
    comments: [],
  },
];

export default function GuaurrinotasApp() {
  const [activeView, setActiveView] =
    useState<FeedView>("inicio");

  const [profiles, setProfiles] =
    useState<PetProfile[]>(initialProfiles);

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const [openedProfileUsername, setOpenedProfileUsername] =
    useState<string | null>(null);

  const [openCommentsId, setOpenCommentsId] =
    useState<number | null>(null);

  const [commentDrafts, setCommentDrafts] = useState<
    Record<number, string>
  >({});

  const selectedProfileUsername =
    openedProfileUsername ??
    (activeView === "perfil" ? currentUsername : null);

  const selectedProfile = selectedProfileUsername
    ? profiles.find(
        (profile) =>
          profile.username === selectedProfileUsername,
      )
    : undefined;

  const visibleNotes = selectedProfileUsername
    ? notes.filter(
        (note) => note.username === selectedProfileUsername,
      )
    : activeView === "siguiendo"
      ? notes.filter((note) =>
          profiles.some(
            (profile) =>
              profile.username === note.username &&
              profile.isFollowing,
          ),
        )
      : notes;

  const selectedProfileNoteCount = selectedProfile
    ? notes.filter(
        (note) => note.username === selectedProfile.username,
      ).length
    : 0;

  const changeView = (view: FeedView) => {
    setActiveView(view);
    setOpenedProfileUsername(null);
    setOpenCommentsId(null);
  };

  const openProfile = (username: string) => {
    setOpenedProfileUsername(username);
    setOpenCommentsId(null);
    setIsComposerOpen(false);
  };

  const toggleFollow = (username: string) => {
    if (username === currentUsername) return;

    setProfiles((currentProfiles) => {
      const targetProfile = currentProfiles.find(
        (profile) => profile.username === username,
      );

      if (!targetProfile) return currentProfiles;

      const followingChange = targetProfile.isFollowing
        ? -1
        : 1;

      return currentProfiles.map((profile) => {
        if (profile.username === username) {
          return {
            ...profile,
            isFollowing: !profile.isFollowing,
            followers: Math.max(
              0,
              profile.followers + followingChange,
            ),
          };
        }

        if (profile.username === currentUsername) {
          return {
            ...profile,
            following: Math.max(
              0,
              profile.following + followingChange,
            ),
          };
        }

        return profile;
      });
    });
  };

  const toggleLike = (noteId: number) => {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              liked: !note.liked,
              likes: note.liked
                ? note.likes - 1
                : note.likes + 1,
            }
          : note,
      ),
    );
  };

  const publishNote = () => {
    const cleanMessage = newMessage.trim();

    if (!cleanMessage) return;

    const robbieProfile = profiles.find(
      (profile) => profile.username === currentUsername,
    );

    const newNote: Note = {
      id: Date.now(),
      petName: robbieProfile?.petName ?? "Robbie",
      username: currentUsername,
      avatar: robbieProfile?.avatar ?? "🐶",
      message: cleanMessage,
      time: "Ahora",
      likes: 0,
      liked: false,
      comments: [],
    };

    setNotes((currentNotes) => [newNote, ...currentNotes]);
    setNewMessage("");
    setIsComposerOpen(false);
    setOpenedProfileUsername(null);
    setActiveView("inicio");
  };

  const toggleComments = (noteId: number) => {
    setOpenCommentsId((currentId) =>
      currentId === noteId ? null : noteId,
    );
  };

  const publishComment = (noteId: number) => {
    const cleanComment = (
      commentDrafts[noteId] ?? ""
    ).trim();

    if (!cleanComment) return;

    const robbieProfile = profiles.find(
      (profile) => profile.username === currentUsername,
    );

    const newComment: NoteComment = {
      id: Date.now(),
      petName: robbieProfile?.petName ?? "Robbie",
      username: currentUsername,
      avatar: robbieProfile?.avatar ?? "🐶",
      message: cleanComment,
      time: "Ahora",
    };

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
              ...note,
              comments: [...note.comments, newComment],
            }
          : note,
      ),
    );

    setCommentDrafts((currentDrafts) => ({
      ...currentDrafts,
      [noteId]: "",
    }));
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <header className="border-2 border-[#425b8c] bg-[#f2f2f2] p-4 shadow-[4px_4px_0_#425b8c]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#637497]">
              Comunidad Guaurritas
            </p>

            <h2 className="mt-1 text-2xl font-bold text-[#263650]">
              Guaurrinotas
            </h2>

            <p className="mt-1 text-sm text-[#53627a]">
              Historias pequeñas de vidas muy importantes.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="flex h-14 w-14 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-white text-3xl shadow-[3px_3px_0_#425b8c]"
          >
            🐶
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            setIsComposerOpen((current) => !current)
          }
          className="mt-4 w-full border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 font-mono text-sm font-bold shadow-[3px_3px_0_#425b8c] hover:bg-[#cbd8ed]"
        >
          {isComposerOpen
            ? "× Cerrar nueva nota"
            : "+ Nueva nota"}
        </button>
      </header>

      {isComposerOpen && (
        <section className="mt-5 border-2 border-[#425b8c] bg-white p-4 shadow-[4px_4px_0_#425b8c]">
          <label
            htmlFor="new-note"
            className="font-mono text-sm font-bold"
          >
            ¿Qué quiere contar Robbie?
          </label>

          <textarea
            id="new-note"
            value={newMessage}
            onChange={(event) =>
              setNewMessage(event.target.value)
            }
            maxLength={220}
            placeholder="Escribe una nueva Guaurrinota..."
            className="mt-3 min-h-28 w-full resize-none border-2 border-[#425b8c] bg-[#f8f8f8] p-3 text-sm outline-none focus:bg-white"
          />

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-[#637497]">
              {newMessage.length}/220
            </span>

            <button
              type="button"
              onClick={publishNote}
              disabled={!newMessage.trim()}
              className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[3px_3px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Publicar nota
            </button>
          </div>
        </section>
      )}

      <nav
        aria-label="Secciones de Guaurrinotas"
        className="mt-5 grid grid-cols-3 border-2 border-[#425b8c] bg-white"
      >
        {[
          { id: "inicio", label: "Inicio" },
          { id: "siguiendo", label: "Siguiendo" },
          { id: "perfil", label: "Mi perfil" },
        ].map((view) => (
          <button
            key={view.id}
            type="button"
            onClick={() =>
              changeView(view.id as FeedView)
            }
            className={`border-r-2 border-[#425b8c] px-2 py-3 font-mono text-xs font-bold last:border-r-0 ${
              activeView === view.id &&
              !openedProfileUsername
                ? "bg-[#425b8c] text-white"
                : "bg-white hover:bg-[#dce4f2]"
            }`}
          >
            {view.label}
          </button>
        ))}
      </nav>

      {selectedProfile && (
        <section className="mt-5 border-2 border-[#425b8c] bg-[#f8f8f8] p-4 shadow-[4px_4px_0_#425b8c]">
          {openedProfileUsername && (
            <button
              type="button"
              onClick={() =>
                setOpenedProfileUsername(null)
              }
              className="mb-4 font-mono text-xs font-bold text-[#425b8c] hover:underline"
            >
              ← Volver
            </button>
          )}

          <div className="flex items-start gap-4">
            <div
              aria-hidden="true"
              className="flex h-20 w-20 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-[#dce4f2] text-4xl shadow-[3px_3px_0_#425b8c]"
            >
              {selectedProfile.avatar}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-[#263650]">
                {selectedProfile.petName}
              </h3>

              <p className="font-mono text-xs text-[#637497]">
                {selectedProfile.username}
              </p>

              {selectedProfile.isCurrentUser ? (
                <span className="mt-3 inline-block border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold">
                  Este es tu perfil
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    toggleFollow(selectedProfile.username)
                  }
                  aria-pressed={
                    selectedProfile.isFollowing
                  }
                  className={`mt-3 border-2 border-[#425b8c] px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#425b8c] ${
                    selectedProfile.isFollowing
                      ? "bg-white text-[#425b8c] hover:bg-[#f0f3f8]"
                      : "bg-[#425b8c] text-white hover:bg-[#263650]"
                  }`}
                >
                  {selectedProfile.isFollowing
                    ? "✓ Siguiendo"
                    : "+ Seguir"}
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[#263650]">
            {selectedProfile.bio}
          </p>

          <div className="mt-3 space-y-1 font-mono text-[11px] text-[#637497]">
            <p>📍 {selectedProfile.location}</p>
            <p>🗓 {selectedProfile.joined}</p>
          </div>

          <div className="mt-4 grid grid-cols-3 border-2 border-[#425b8c] bg-white text-center">
            <div className="border-r-2 border-[#425b8c] p-3">
              <p className="font-bold text-[#263650]">
                {selectedProfileNoteCount}
              </p>
              <p className="font-mono text-[10px] text-[#637497]">
                Notas
              </p>
            </div>

            <div className="border-r-2 border-[#425b8c] p-3">
              <p className="font-bold text-[#263650]">
                {selectedProfile.followers}
              </p>
              <p className="font-mono text-[10px] text-[#637497]">
                Seguidores
              </p>
            </div>

            <div className="p-3">
              <p className="font-bold text-[#263650]">
                {selectedProfile.following}
              </p>
              <p className="font-mono text-[10px] text-[#637497]">
                Siguiendo
              </p>
            </div>
          </div>
        </section>
      )}

      <main className="mt-5 space-y-5">
        {visibleNotes.map((note) => {
          const commentsAreOpen =
            openCommentsId === note.id;

          const commentDraft =
            commentDrafts[note.id] ?? "";

          return (
            <article
              key={note.id}
              className="border-2 border-[#425b8c] bg-white p-4 shadow-[4px_4px_0_#425b8c]"
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    openProfile(note.username)
                  }
                  aria-label={`Ver perfil de ${note.petName}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-[#dce4f2] text-2xl hover:bg-[#cbd8ed]"
                >
                  {note.avatar}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openProfile(note.username)
                      }
                      className="text-left hover:underline"
                    >
                      <h3 className="font-bold">
                        {note.petName}
                      </h3>

                      <p className="font-mono text-xs text-[#637497]">
                        {note.username}
                      </p>
                    </button>

                    <span className="font-mono text-[11px] text-[#637497]">
                      {note.time}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-[#263650]">
                    {note.message}
                  </p>

                  <div className="mt-4 flex items-center gap-5 border-t-2 border-dashed border-[#cbd4e4] pt-3">
                    <button
                      type="button"
                      onClick={() => toggleLike(note.id)}
                      className={`font-mono text-xs font-bold ${
                        note.liked
                          ? "text-[#425b8c]"
                          : "text-[#637497] hover:text-[#425b8c]"
                      }`}
                    >
                      {note.liked ? "♥" : "♡"}{" "}
                      {note.likes}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        toggleComments(note.id)
                      }
                      aria-expanded={commentsAreOpen}
                      aria-controls={`comments-${note.id}`}
                      className="font-mono text-xs font-bold text-[#637497] hover:text-[#425b8c]"
                    >
                      💬 {note.comments.length}{" "}
                      {commentsAreOpen
                        ? "Cerrar"
                        : "Comentar"}
                    </button>
                  </div>
                </div>
              </div>

              {commentsAreOpen && (
                <section
                  id={`comments-${note.id}`}
                  className="mt-4 border-t-2 border-[#425b8c] pt-4"
                >
                  <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#425b8c]">
                    Comentarios
                  </h4>

                  <div className="mt-3 space-y-3">
                    {note.comments.map((comment) => (
                      <div
                        key={comment.id}
                        className="flex gap-3 border-2 border-[#cbd4e4] bg-[#f8f8f8] p-3"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openProfile(
                              comment.username,
                            )
                          }
                          aria-label={`Ver perfil de ${comment.petName}`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-white text-lg hover:bg-[#dce4f2]"
                        >
                          {comment.avatar}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openProfile(
                                  comment.username,
                                )
                              }
                              className="text-left hover:underline"
                            >
                              <p className="text-sm font-bold">
                                {comment.petName}
                              </p>

                              <p className="font-mono text-[10px] text-[#637497]">
                                {comment.username}
                              </p>
                            </button>

                            <span className="font-mono text-[10px] text-[#637497]">
                              {comment.time}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-5 text-[#263650]">
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    ))}

                    {note.comments.length === 0 && (
                      <div className="border-2 border-dashed border-[#cbd4e4] p-4 text-center">
                        <p className="text-sm text-[#637497]">
                          Todavía no hay comentarios.
                          Robbie puede ser el primero.
                        </p>
                      </div>
                    )}
                  </div>

                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      publishComment(note.id);
                    }}
                    className="mt-4 border-2 border-[#425b8c] bg-[#dce4f2] p-3"
                  >
                    <label
                      htmlFor={`comment-${note.id}`}
                      className="font-mono text-xs font-bold"
                    >
                      Comentar como Robbie
                    </label>

                    <textarea
                      id={`comment-${note.id}`}
                      value={commentDraft}
                      onChange={(event) =>
                        setCommentDrafts(
                          (currentDrafts) => ({
                            ...currentDrafts,
                            [note.id]:
                              event.target.value,
                          }),
                        )
                      }
                      maxLength={160}
                      placeholder="Escribe un comentario..."
                      className="mt-2 min-h-20 w-full resize-none border-2 border-[#425b8c] bg-white p-3 text-sm outline-none"
                    />

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] text-[#637497]">
                        {commentDraft.length}/160
                      </span>

                      <button
                        type="submit"
                        disabled={!commentDraft.trim()}
                        className="border-2 border-[#425b8c] bg-[#425b8c] px-3 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Publicar comentario
                      </button>
                    </div>
                  </form>
                </section>
              )}
            </article>
          );
        })}

        {visibleNotes.length === 0 && (
          <div className="border-2 border-dashed border-[#425b8c] bg-white p-8 text-center">
            <p className="font-mono text-sm font-bold">
              {activeView === "siguiendo"
                ? "Todavía no hay publicaciones de mascotas que sigues."
                : "Este perfil todavía no tiene publicaciones."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}