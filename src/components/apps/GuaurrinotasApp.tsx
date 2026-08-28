"use client";

import { useEffect, useState } from "react";

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

type ProfileDraft = Pick<
  PetProfile,
  "petName" | "bio" | "location"
>;

type LocationAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_district?: string;
  region?: string;
  country?: string;
};

type NominatimPlace = {
  place_id?: number;
  osm_id?: number;
  address?: LocationAddress;
};

type LocationSuggestion = {
  id: string;
  label: string;
  value: string;
};

type CityOption = {
  city: string;
  state: string;
};

const NOMINATIM_BASE_URL =
  "https://nominatim.openstreetmap.org";

const MEXICAN_CITIES: CityOption[] = [
  { city: "Aguascalientes", state: "Aguascalientes" },
  { city: "San Francisco de los Romo", state: "Aguascalientes" },
  { city: "Mexicali", state: "Baja California" },
  { city: "Tijuana", state: "Baja California" },
  { city: "Ensenada", state: "Baja California" },
  { city: "Tecate", state: "Baja California" },
  { city: "Playas de Rosarito", state: "Baja California" },
  { city: "La Paz", state: "Baja California Sur" },
  { city: "Cabo San Lucas", state: "Baja California Sur" },
  { city: "San José del Cabo", state: "Baja California Sur" },
  { city: "Campeche", state: "Campeche" },
  { city: "Ciudad del Carmen", state: "Campeche" },
  { city: "Tuxtla Gutiérrez", state: "Chiapas" },
  { city: "San Cristóbal de las Casas", state: "Chiapas" },
  { city: "Tapachula", state: "Chiapas" },
  { city: "Comitán de Domínguez", state: "Chiapas" },
  { city: "Palenque", state: "Chiapas" },
  { city: "Chihuahua", state: "Chihuahua" },
  { city: "Ciudad Juárez", state: "Chihuahua" },
  { city: "Delicias", state: "Chihuahua" },
  { city: "Cuauhtémoc", state: "Chihuahua" },
  { city: "Hidalgo del Parral", state: "Chihuahua" },
  { city: "Saltillo", state: "Coahuila" },
  { city: "Torreón", state: "Coahuila" },
  { city: "Monclova", state: "Coahuila" },
  { city: "Piedras Negras", state: "Coahuila" },
  { city: "Ciudad Acuña", state: "Coahuila" },
  { city: "Ramos Arizpe", state: "Coahuila" },
  { city: "Colima", state: "Colima" },
  { city: "Manzanillo", state: "Colima" },
  { city: "Tecomán", state: "Colima" },
  { city: "Ciudad de México", state: "Ciudad de México" },
  { city: "Durango", state: "Durango" },
  { city: "Gómez Palacio", state: "Durango" },
  { city: "Lerdo", state: "Durango" },
  { city: "León", state: "Guanajuato" },
  { city: "Guanajuato", state: "Guanajuato" },
  { city: "Irapuato", state: "Guanajuato" },
  { city: "Celaya", state: "Guanajuato" },
  { city: "Salamanca", state: "Guanajuato" },
  { city: "Silao", state: "Guanajuato" },
  { city: "San Miguel de Allende", state: "Guanajuato" },
  { city: "Moroleón", state: "Guanajuato" },
  { city: "Uriangato", state: "Guanajuato" },
  { city: "Valle de Santiago", state: "Guanajuato" },
  { city: "Dolores Hidalgo", state: "Guanajuato" },
  { city: "Acapulco", state: "Guerrero" },
  { city: "Chilpancingo", state: "Guerrero" },
  { city: "Iguala", state: "Guerrero" },
  { city: "Taxco", state: "Guerrero" },
  { city: "Zihuatanejo", state: "Guerrero" },
  { city: "Pachuca", state: "Hidalgo" },
  { city: "Tulancingo", state: "Hidalgo" },
  { city: "Tula de Allende", state: "Hidalgo" },
  { city: "Mineral de la Reforma", state: "Hidalgo" },
  { city: "Guadalajara", state: "Jalisco" },
  { city: "Zapopan", state: "Jalisco" },
  { city: "San Pedro Tlaquepaque", state: "Jalisco" },
  { city: "Tonalá", state: "Jalisco" },
  { city: "Tlajomulco de Zúñiga", state: "Jalisco" },
  { city: "Puerto Vallarta", state: "Jalisco" },
  { city: "Lagos de Moreno", state: "Jalisco" },
  { city: "Tepatitlán de Morelos", state: "Jalisco" },
  { city: "Toluca", state: "Estado de México" },
  { city: "Ecatepec", state: "Estado de México" },
  { city: "Nezahualcóyotl", state: "Estado de México" },
  { city: "Naucalpan", state: "Estado de México" },
  { city: "Tlalnepantla", state: "Estado de México" },
  { city: "Metepec", state: "Estado de México" },
  { city: "Lerma", state: "Estado de México" },
  { city: "Cuautitlán Izcalli", state: "Estado de México" },
  { city: "Atizapán de Zaragoza", state: "Estado de México" },
  { city: "Texcoco", state: "Estado de México" },
  { city: "Valle de Bravo", state: "Estado de México" },
  { city: "Ixtapaluca", state: "Estado de México" },
  { city: "Chimalhuacán", state: "Estado de México" },
  { city: "Morelia", state: "Michoacán" },
  { city: "Uruapan", state: "Michoacán" },
  { city: "Zamora", state: "Michoacán" },
  { city: "Lázaro Cárdenas", state: "Michoacán" },
  { city: "Pátzcuaro", state: "Michoacán" },
  { city: "La Piedad", state: "Michoacán" },
  { city: "Apatzingán", state: "Michoacán" },
  { city: "Zitácuaro", state: "Michoacán" },
  { city: "Cuernavaca", state: "Morelos" },
  { city: "Jiutepec", state: "Morelos" },
  { city: "Cuautla", state: "Morelos" },
  { city: "Temixco", state: "Morelos" },
  { city: "Jojutla", state: "Morelos" },
  { city: "Tepic", state: "Nayarit" },
  { city: "Bahía de Banderas", state: "Nayarit" },
  { city: "Santiago Ixcuintla", state: "Nayarit" },
  { city: "Monterrey", state: "Nuevo León" },
  { city: "Guadalupe", state: "Nuevo León" },
  { city: "San Nicolás de los Garza", state: "Nuevo León" },
  { city: "Apodaca", state: "Nuevo León" },
  { city: "Santa Catarina", state: "Nuevo León" },
  { city: "General Escobedo", state: "Nuevo León" },
  { city: "San Pedro Garza García", state: "Nuevo León" },
  { city: "Oaxaca de Juárez", state: "Oaxaca" },
  { city: "Juchitán", state: "Oaxaca" },
  { city: "Salina Cruz", state: "Oaxaca" },
  { city: "Tuxtepec", state: "Oaxaca" },
  { city: "Puerto Escondido", state: "Oaxaca" },
  { city: "Puebla", state: "Puebla" },
  { city: "Tehuacán", state: "Puebla" },
  { city: "San Martín Texmelucan", state: "Puebla" },
  { city: "Atlixco", state: "Puebla" },
  { city: "San Pedro Cholula", state: "Puebla" },
  { city: "San Andrés Cholula", state: "Puebla" },
  { city: "Querétaro", state: "Querétaro" },
  { city: "San Juan del Río", state: "Querétaro" },
  { city: "El Marqués", state: "Querétaro" },
  { city: "Corregidora", state: "Querétaro" },
  { city: "Cancún", state: "Quintana Roo" },
  { city: "Playa del Carmen", state: "Quintana Roo" },
  { city: "Chetumal", state: "Quintana Roo" },
  { city: "Tulum", state: "Quintana Roo" },
  { city: "Cozumel", state: "Quintana Roo" },
  { city: "Isla Mujeres", state: "Quintana Roo" },
  { city: "San Luis Potosí", state: "San Luis Potosí" },
  { city: "Soledad de Graciano Sánchez", state: "San Luis Potosí" },
  { city: "Ciudad Valles", state: "San Luis Potosí" },
  { city: "Matehuala", state: "San Luis Potosí" },
  { city: "Rioverde", state: "San Luis Potosí" },
  { city: "Culiacán", state: "Sinaloa" },
  { city: "Mazatlán", state: "Sinaloa" },
  { city: "Los Mochis", state: "Sinaloa" },
  { city: "Guasave", state: "Sinaloa" },
  { city: "Hermosillo", state: "Sonora" },
  { city: "Nogales", state: "Sonora" },
  { city: "Ciudad Obregón", state: "Sonora" },
  { city: "San Luis Río Colorado", state: "Sonora" },
  { city: "Navojoa", state: "Sonora" },
  { city: "Guaymas", state: "Sonora" },
  { city: "Villahermosa", state: "Tabasco" },
  { city: "Cárdenas", state: "Tabasco" },
  { city: "Comalcalco", state: "Tabasco" },
  { city: "Paraíso", state: "Tabasco" },
  { city: "Reynosa", state: "Tamaulipas" },
  { city: "Matamoros", state: "Tamaulipas" },
  { city: "Nuevo Laredo", state: "Tamaulipas" },
  { city: "Tampico", state: "Tamaulipas" },
  { city: "Ciudad Victoria", state: "Tamaulipas" },
  { city: "Ciudad Madero", state: "Tamaulipas" },
  { city: "Altamira", state: "Tamaulipas" },
  { city: "Tlaxcala", state: "Tlaxcala" },
  { city: "Apizaco", state: "Tlaxcala" },
  { city: "Huamantla", state: "Tlaxcala" },
  { city: "Chiautempan", state: "Tlaxcala" },
  { city: "Veracruz", state: "Veracruz" },
  { city: "Xalapa", state: "Veracruz" },
  { city: "Coatzacoalcos", state: "Veracruz" },
  { city: "Córdoba", state: "Veracruz" },
  { city: "Orizaba", state: "Veracruz" },
  { city: "Poza Rica", state: "Veracruz" },
  { city: "Boca del Río", state: "Veracruz" },
  { city: "Minatitlán", state: "Veracruz" },
  { city: "Tuxpan", state: "Veracruz" },
  { city: "Mérida", state: "Yucatán" },
  { city: "Valladolid", state: "Yucatán" },
  { city: "Progreso", state: "Yucatán" },
  { city: "Zacatecas", state: "Zacatecas" },
  { city: "Guadalupe", state: "Zacatecas" },
  { city: "Fresnillo", state: "Zacatecas" },
  { city: "Jerez", state: "Zacatecas" },
];

const buildLocationValue = (
  address?: LocationAddress,
) => {
  if (!address) return "";

  const city =
    address.city ??
    address.town ??
    address.village ??
    address.municipality ??
    address.county;

  const region =
    address.state ??
    address.state_district ??
    address.region ??
    address.country;

  return Array.from(
    new Set(
      [city, region].filter(
        (part): part is string => Boolean(part),
      ),
    ),
  ).join(", ");
};

const normalizeLocationText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-MX");

const searchMexicanCities = (
  query: string,
): LocationSuggestion[] => {
  const normalizedQuery = normalizeLocationText(query.trim());

  if (normalizedQuery.length < 2) return [];

  return MEXICAN_CITIES.map((option) => {
    const city = normalizeLocationText(option.city);
    const fullValue = `${option.city}, ${option.state}`;
    const searchableValue = normalizeLocationText(fullValue);

    const priority = city.startsWith(normalizedQuery)
      ? 0
      : searchableValue.startsWith(normalizedQuery)
        ? 1
        : 2;

    return {
      option,
      fullValue,
      searchableValue,
      priority,
    };
  })
    .filter(({ searchableValue }) =>
      searchableValue.includes(normalizedQuery),
    )
    .sort(
      (first, second) =>
        first.priority - second.priority ||
        first.option.city.localeCompare(
          second.option.city,
          "es-MX",
        ),
    )
    .slice(0, 6)
    .map(({ option, fullValue }) => ({
      id: `${option.state}-${option.city}`,
      label: `${fullValue}, México`,
      value: fullValue,
    }));
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

  const [isEditingProfile, setIsEditingProfile] =
    useState(false);

  const [profileDraft, setProfileDraft] =
    useState<ProfileDraft>({
      petName: "",
      bio: "",
      location: "",
    });

  const [profileFeedback, setProfileFeedback] =
    useState("");

  const [isLocating, setIsLocating] = useState(false);
  const [isSearchingLocation, setIsSearchingLocation] =
    useState(false);
  const [showLocationSearch, setShowLocationSearch] =
    useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationSuggestions, setLocationSuggestions] =
    useState<LocationSuggestion[]>([]);
  const [locationStatus, setLocationStatus] = useState("");

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
    setIsEditingProfile(false);
    setProfileFeedback("");
  };

  const openProfile = (username: string) => {
    setOpenedProfileUsername(username);
    setOpenCommentsId(null);
    setIsComposerOpen(false);
    setIsEditingProfile(false);
    setProfileFeedback("");
  };

  const startEditingProfile = () => {
    const currentProfile = profiles.find(
      (profile) => profile.username === currentUsername,
    );

    if (!currentProfile) return;

    setProfileDraft({
      petName: currentProfile.petName,
      bio: currentProfile.bio,
      location: currentProfile.location,
    });

    setLocationQuery(currentProfile.location);
    setLocationSuggestions([]);
    setLocationStatus("");
    setShowLocationSearch(false);
    setProfileFeedback("");
    setIsEditingProfile(true);
  };

  const cancelEditingProfile = () => {
    setIsEditingProfile(false);
    setShowLocationSearch(false);
    setLocationSuggestions([]);
    setLocationStatus("");
    setProfileFeedback("");
  };

  const selectLocation = (
    suggestion: LocationSuggestion,
  ) => {
    setProfileDraft((currentDraft) => ({
      ...currentDraft,
      location: suggestion.value,
    }));
    setLocationQuery(suggestion.value);
    setLocationSuggestions([]);
    setShowLocationSearch(false);
    setLocationStatus(
      "✓ Ubicación seleccionada: " + suggestion.value,
    );
  };

  const detectCurrentLocation = async () => {
    if (!("geolocation" in navigator)) {
      setLocationStatus(
        "Este navegador no permite detectar tu ubicación. Puedes escribir tu ciudad manualmente.",
      );
      return;
    }

    setIsLocating(true);
    setLocationSuggestions([]);
    setLocationStatus(
      "Solicitando permiso para detectar tu ciudad…",
    );

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 300000,
            },
          );
        },
      );

      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(position.coords.latitude),
        lon: String(position.coords.longitude),
        addressdetails: "1",
        zoom: "10",
        "accept-language": "es",
      });

      const response = await fetch(
        NOMINATIM_BASE_URL +
          "/reverse?" +
          params.toString(),
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("No se pudo consultar la ciudad.");
      }

      const result =
        (await response.json()) as NominatimPlace;
      const location = buildLocationValue(result.address);

      if (!location) {
        throw new Error("No se encontró una ciudad.");
      }

      setProfileDraft((currentDraft) => ({
        ...currentDraft,
        location,
      }));
      setLocationQuery(location);
      setShowLocationSearch(false);
      setLocationStatus(
        "✓ Detectamos " +
          location +
          ". Solo se guardará ciudad y estado.",
      );
    } catch (error) {
      const geolocationCode =
        typeof error === "object" &&
        error !== null &&
        "code" in error
          ? Number(error.code)
          : null;

      if (geolocationCode === 1) {
        setLocationStatus(
          "No diste permiso de ubicación. Puedes buscar o escribir tu ciudad manualmente.",
        );
      } else if (geolocationCode === 2) {
        setLocationStatus(
          "No pudimos detectar tu ubicación. Intenta buscar tu ciudad manualmente.",
        );
      } else if (geolocationCode === 3) {
        setLocationStatus(
          "La ubicación tardó demasiado. Inténtalo otra vez o busca tu ciudad.",
        );
      } else {
        setLocationStatus(
          "Detectamos tu posición, pero no pudimos convertirla en ciudad. Puedes escribirla manualmente.",
        );
      }
    } finally {
      setIsLocating(false);
    }
  };

  useEffect(() => {
    if (!showLocationSearch) return;

    const cleanQuery = locationQuery.trim();
    const searchTimer = window.setTimeout(() => {
      if (cleanQuery.length < 2) {
        setLocationSuggestions([]);
        setIsSearchingLocation(false);
        setLocationStatus(
          cleanQuery.length === 1
            ? "Escribe una letra más para ver ciudades."
            : "",
        );
        return;
      }

      const suggestions = searchMexicanCities(cleanQuery);

      setIsSearchingLocation(false);
      setLocationSuggestions(suggestions);
      setLocationStatus(
        suggestions.length > 0
          ? "Elige una ciudad de la lista."
          : "No encontramos coincidencias en México. Puedes escribir tu ciudad manualmente arriba.",
      );
    }, 0);

    return () => window.clearTimeout(searchTimer);
  }, [locationQuery, showLocationSearch]);

  const saveProfile = () => {
    const petName = profileDraft.petName.trim();
    const bio = profileDraft.bio.trim();
    const location = profileDraft.location.trim();

    if (!petName || !bio || !location) return;

    setProfiles((currentProfiles) =>
      currentProfiles.map((profile) =>
        profile.username === currentUsername
          ? {
              ...profile,
              petName,
              bio,
              location,
            }
          : profile,
      ),
    );

    setNotes((currentNotes) =>
      currentNotes.map((note) => ({
        ...note,
        petName:
          note.username === currentUsername
            ? petName
            : note.petName,
        comments: note.comments.map((comment) =>
          comment.username === currentUsername
            ? {
                ...comment,
                petName,
              }
            : comment,
        ),
      })),
    );

    setIsEditingProfile(false);
    setShowLocationSearch(false);
    setLocationSuggestions([]);
    setLocationStatus("");
    setProfileFeedback(
      "✓ Los cambios se guardaron en tu perfil.",
    );
  };

  const shareProfile = async (profile: PetProfile) => {
    const profileText = [
      `${profile.petName} ${profile.username}`,
      profile.bio,
      `📍 ${profile.location}`,
      `🗓 ${profile.joined}`,
      "",
      "Conoce su historia en Guaurritas.",
    ].join("\n");

    setProfileFeedback("");

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Perfil de ${profile.petName} | Guaurritas`,
          text: profileText,
        });

        setProfileFeedback("✓ Perfil compartido.");
        return;
      }

      await navigator.clipboard.writeText(profileText);

      setProfileFeedback(
        "✓ Perfil copiado. Ya puedes pegarlo donde quieras.",
      );
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(profileText);

        setProfileFeedback(
          "✓ Perfil copiado. Ya puedes pegarlo donde quieras.",
        );
      } catch {
        setProfileFeedback(
          "No fue posible compartir el perfil desde este navegador.",
        );
      }
    }
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
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={startEditingProfile}
                    className="border-2 border-[#425b8c] bg-[#425b8c] px-3 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650]"
                  >
                    ✎ Editar perfil
                  </button>

                  <button
                    type="button"
                    onClick={() => void shareProfile(selectedProfile)}
                    className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#dce4f2]"
                  >
                    ↗ Compartir
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      toggleFollow(selectedProfile.username)
                    }
                    aria-pressed={selectedProfile.isFollowing}
                    className={`border-2 border-[#425b8c] px-3 py-2 font-mono text-xs font-bold shadow-[2px_2px_0_#425b8c] ${
                      selectedProfile.isFollowing
                        ? "bg-white text-[#425b8c] hover:bg-[#f0f3f8]"
                        : "bg-[#425b8c] text-white hover:bg-[#263650]"
                    }`}
                  >
                    {selectedProfile.isFollowing
                      ? "✓ Siguiendo"
                      : "+ Seguir"}
                  </button>

                  <button
                    type="button"
                    onClick={() => void shareProfile(selectedProfile)}
                    className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#dce4f2]"
                  >
                    ↗ Compartir
                  </button>
                </div>
              )}
            </div>
          </div>

          {selectedProfile.isCurrentUser &&
          isEditingProfile ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                saveProfile();
              }}
              className="mt-5 border-2 border-[#425b8c] bg-white p-4"
            >
              <h4 className="font-mono text-sm font-bold text-[#263650]">
                Editar mi perfil
              </h4>

              <label
                htmlFor="profile-name"
                className="mt-4 block font-mono text-xs font-bold"
              >
                Nombre de tu mascota
              </label>

              <input
                id="profile-name"
                value={profileDraft.petName}
                onChange={(event) =>
                  setProfileDraft((currentDraft) => ({
                    ...currentDraft,
                    petName: event.target.value,
                  }))
                }
                maxLength={28}
                required
                className="mt-2 w-full border-2 border-[#425b8c] bg-[#f8f8f8] p-3 text-sm outline-none focus:bg-white"
              />

              <div className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                {profileDraft.petName.length}/28
              </div>

              <label
                htmlFor="profile-bio"
                className="mt-3 block font-mono text-xs font-bold"
              >
                Biografía
              </label>

              <textarea
                id="profile-bio"
                value={profileDraft.bio}
                onChange={(event) =>
                  setProfileDraft((currentDraft) => ({
                    ...currentDraft,
                    bio: event.target.value,
                  }))
                }
                maxLength={140}
                required
                className="mt-2 min-h-24 w-full resize-none border-2 border-[#425b8c] bg-[#f8f8f8] p-3 text-sm outline-none focus:bg-white"
              />

              <div className="mt-1 text-right font-mono text-[10px] text-[#637497]">
                {profileDraft.bio.length}/140
              </div>

              <label
                htmlFor="profile-location"
                className="mt-3 block font-mono text-xs font-bold"
              >
                Ubicación visible
              </label>

              <input
                id="profile-location"
                value={profileDraft.location}
                onChange={(event) => {
                  setProfileDraft((currentDraft) => ({
                    ...currentDraft,
                    location: event.target.value,
                  }));
                  setLocationStatus("");
                }}
                maxLength={50}
                required
                placeholder="Ciudad, estado"
                className="mt-2 w-full border-2 border-[#425b8c] bg-[#f8f8f8] p-3 text-sm outline-none focus:bg-white"
              />

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void detectCurrentLocation()}
                  disabled={
                    isLocating || isSearchingLocation
                  }
                  className="border-2 border-[#425b8c] bg-[#dce4f2] px-3 py-2 font-mono text-xs font-bold text-[#263650] shadow-[2px_2px_0_#425b8c] hover:bg-[#cbd8ed] disabled:cursor-wait disabled:opacity-50"
                >
                  {isLocating
                    ? "Detectando ciudad…"
                    : "📍 Usar mi ubicación"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowLocationSearch((current) => {
                      const nextValue = !current;

                      if (nextValue) {
                        setLocationQuery("");
                        setLocationSuggestions([]);
                        setLocationStatus("");
                      }

                      return nextValue;
                    });
                  }}
                  disabled={isLocating}
                  aria-expanded={showLocationSearch}
                  aria-controls="location-search"
                  className="border-2 border-[#425b8c] bg-white px-3 py-2 font-mono text-xs font-bold text-[#425b8c] shadow-[2px_2px_0_#425b8c] hover:bg-[#f0f3f8] disabled:opacity-50"
                >
                  {showLocationSearch
                    ? "× Cerrar búsqueda"
                    : "⌕ Buscar otra ciudad"}
                </button>
              </div>

              <p className="mt-3 text-xs leading-5 text-[#637497]">
                Solo mostraremos ciudad y estado. Tu dirección
                y tus coordenadas exactas nunca se guardan en
                el perfil.
              </p>

              {showLocationSearch && (
                <section
                  id="location-search"
                  className="mt-3 border-2 border-[#425b8c] bg-[#f8f8f8] p-3"
                >
                  <label
                    htmlFor="location-query"
                    className="font-mono text-xs font-bold text-[#263650]"
                  >
                    Escribe una ciudad
                  </label>

                  <p className="mt-1 text-xs leading-5 text-[#637497]">
                    Las opciones aparecerán mientras escribes.
                  </p>

                  <div className="relative mt-2">
                    <input
                      id="location-query"
                      value={locationQuery}
                      onChange={(event) => {
                        setLocationQuery(
                          event.target.value,
                        );
                        setLocationSuggestions([]);
                        setLocationStatus("");
                      }}
                      maxLength={80}
                      autoComplete="off"
                      placeholder="Ej. Le"
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={
                        locationSuggestions.length > 0
                      }
                      aria-controls="location-suggestions"
                      className="w-full border-2 border-[#425b8c] bg-white p-3 pr-11 text-sm outline-none focus:bg-white"
                    />

                    {isSearchingLocation && (
                      <span
                        aria-hidden="true"
                        className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-bold text-[#637497]"
                      >
                        ···
                      </span>
                    )}
                  </div>

                  {locationSuggestions.length > 0 && (
                    <div
                      id="location-suggestions"
                      role="listbox"
                      aria-label="Ciudades sugeridas"
                      className="mt-2 overflow-hidden border-2 border-[#425b8c] bg-white shadow-[3px_3px_0_#425b8c]"
                    >
                      {locationSuggestions.map(
                        (suggestion, index) => (
                          <button
                            key={suggestion.id}
                            type="button"
                            role="option"
                            aria-selected="false"
                            onClick={() =>
                              selectLocation(suggestion)
                            }
                            className="flex w-full items-start gap-2 border-b-2 border-[#cbd4e4] p-3 text-left text-sm text-[#263650] last:border-b-0 hover:bg-[#dce4f2] focus:bg-[#dce4f2] focus:outline-none"
                          >
                            <span aria-hidden="true">📍</span>

                            <span className="min-w-0">
                              <span className="block font-bold">
                                {suggestion.value}
                              </span>

                              {suggestion.label !==
                                suggestion.value && (
                                <span className="mt-0.5 block text-xs text-[#637497]">
                                  {suggestion.label}
                                </span>
                              )}
                            </span>

                            <span className="ml-auto font-mono text-[10px] text-[#637497]">
                              {index + 1}
                            </span>
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </section>
              )}

              {locationStatus && (
                <p
                  role="status"
                  aria-live="polite"
                  className="mt-3 border-2 border-dashed border-[#425b8c] bg-[#dce4f2] p-3 font-mono text-xs font-bold leading-5 text-[#263650]"
                >
                  {locationStatus}
                </p>
              )}

              <p className="mt-2 text-[10px] text-[#637497]">
                Datos de ubicación de{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-[#425b8c]"
                >
                  OpenStreetMap
                </a>
                .
              </p>

              <div className="mt-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelEditingProfile}
                  className="border-2 border-[#425b8c] bg-white px-4 py-2 font-mono text-xs font-bold text-[#425b8c] hover:bg-[#f0f3f8]"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={
                    !profileDraft.petName.trim() ||
                    !profileDraft.bio.trim() ||
                    !profileDraft.location.trim() ||
                    isLocating ||
                    isSearchingLocation
                  }
                  className="border-2 border-[#425b8c] bg-[#425b8c] px-4 py-2 font-mono text-xs font-bold text-white shadow-[2px_2px_0_#263650] hover:bg-[#263650] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-[#263650]">
                {selectedProfile.bio}
              </p>

              <div className="mt-3 space-y-1 font-mono text-[11px] text-[#637497]">
                <p>📍 {selectedProfile.location}</p>
                <p>🗓 {selectedProfile.joined}</p>
              </div>
            </>
          )}

          {profileFeedback && (
            <p
              role="status"
              className="mt-4 border-2 border-dashed border-[#425b8c] bg-[#dce4f2] p-3 font-mono text-xs font-bold text-[#263650]"
            >
              {profileFeedback}
            </p>
          )}

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
