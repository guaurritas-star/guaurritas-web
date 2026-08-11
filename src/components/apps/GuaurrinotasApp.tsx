"use client";

import { useState } from "react";

type FeedView = "inicio" | "siguiendo" | "perfil";

type Note = {
  id: number;
  petName: string;
  username: string;
  avatar: string;
  message: string;
  time: string;
  likes: number;
  comments: number;
  liked: boolean;
  following: boolean;
};

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
    comments: 5,
    liked: false,
    following: true,
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
    comments: 3,
    liked: false,
    following: true,
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
    comments: 8,
    liked: false,
    following: false,
  },
];

export default function GuaurrinotasApp() {
  const [activeView, setActiveView] =
    useState<FeedView>("inicio");

  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");

  const visibleNotes =
    activeView === "siguiendo"
      ? notes.filter((note) => note.following)
      : activeView === "perfil"
        ? notes.filter(
            (note) => note.username === "@robbie.guaurritas",
          )
        : notes;

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

    const newNote: Note = {
      id: Date.now(),
      petName: "Robbie",
      username: "@robbie.guaurritas",
      avatar: "🐶",
      message: cleanMessage,
      time: "Ahora",
      likes: 0,
      comments: 0,
      liked: false,
      following: true,
    };

    setNotes((currentNotes) => [newNote, ...currentNotes]);
    setNewMessage("");
    setIsComposerOpen(false);
    setActiveView("inicio");
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
          onClick={() => setIsComposerOpen((current) => !current)}
          className="mt-4 w-full border-2 border-[#425b8c] bg-[#dce4f2] px-4 py-3 font-mono text-sm font-bold shadow-[3px_3px_0_#425b8c] hover:bg-[#cbd8ed]"
        >
          {isComposerOpen ? "× Cerrar nueva nota" : "+ Nueva nota"}
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
            onChange={(event) => setNewMessage(event.target.value)}
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
            onClick={() => setActiveView(view.id as FeedView)}
            className={`border-r-2 border-[#425b8c] px-2 py-3 font-mono text-xs font-bold last:border-r-0 ${
              activeView === view.id
                ? "bg-[#425b8c] text-white"
                : "bg-white hover:bg-[#dce4f2]"
            }`}
          >
            {view.label}
          </button>
        ))}
      </nav>

      <main className="mt-5 space-y-5">
        {visibleNotes.map((note) => (
          <article
            key={note.id}
            className="border-2 border-[#425b8c] bg-white p-4 shadow-[4px_4px_0_#425b8c]"
          >
            <div className="flex items-start gap-3">
              <div
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#425b8c] bg-[#dce4f2] text-2xl"
              >
                {note.avatar}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{note.petName}</h3>

                    <p className="font-mono text-xs text-[#637497]">
                      {note.username}
                    </p>
                  </div>

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
                    {note.liked ? "♥" : "♡"} {note.likes}
                  </button>

                  <button
                    type="button"
                    className="font-mono text-xs font-bold text-[#637497] hover:text-[#425b8c]"
                  >
                    💬 {note.comments}
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}

        {visibleNotes.length === 0 && (
          <div className="border-2 border-dashed border-[#425b8c] bg-white p-8 text-center">
            <p className="font-mono text-sm font-bold">
              Todavía no hay notas aquí.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}