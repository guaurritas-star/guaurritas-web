const PHOTON_BASE_URL = "https://photon.komoot.io";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 80;
const RESULT_LIMIT = 6;
const REQUEST_TIMEOUT_MS = 7000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < MIN_QUERY_LENGTH) {
    return Response.json(
      { features: [] },
      { status: 200 },
    );
  }

  if (query.length > MAX_QUERY_LENGTH) {
    return Response.json(
      { message: "La búsqueda es demasiado larga." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const upstreamParams = new URLSearchParams({
      q: query,
      limit: String(RESULT_LIMIT),
      lang: "es",
    });

    upstreamParams.append("layer", "city");
    upstreamParams.append("layer", "locality");

    const response = await fetch(
      PHOTON_BASE_URL + "/api?" + upstreamParams.toString(),
      {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Accept-Language": "es",
          "User-Agent": "Guaurritas/1.0 (https://guaurritas.com)",
        },
        next: {
          revalidate: 86400,
        },
      },
    );

    if (!response.ok) {
      return Response.json(
        { message: "El buscador de ciudades no respondió." },
        { status: 502 },
      );
    }

    const data: unknown = await response.json();

    return Response.json(data, {
      headers: {
        "Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    const timedOut =
      error instanceof Error && error.name === "AbortError";

    return Response.json(
      {
        message: timedOut
          ? "La búsqueda de ciudades tardó demasiado."
          : "No fue posible consultar las ciudades.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
