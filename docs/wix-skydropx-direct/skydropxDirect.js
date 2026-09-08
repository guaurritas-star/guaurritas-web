import { fetch } from 'wix-fetch';
import { secrets } from 'wix-secrets-backend.v2';
import { elevate } from 'wix-auth';

const SKYDROPX_API = 'https://api-pro.skydropx.com';
const FALLBACK_PRICE = '150.00';
const FALLBACK_DAYS = '4-7 días hábiles';

const getSecretValueElevated = elevate(secrets.getSecretValue);

let tokenCache = {
  value: null,
  expiresAt: 0,
};

const MX_SUBDIVISIONS = {
  AGU: 'Aguascalientes',
  BCN: 'Baja California',
  BCS: 'Baja California Sur',
  CAM: 'Campeche',
  CHP: 'Chiapas',
  CHH: 'Chihuahua',
  COA: 'Coahuila de Zaragoza',
  COL: 'Colima',
  CMX: 'Ciudad de México',
  DUR: 'Durango',
  GUA: 'Guanajuato',
  GRO: 'Guerrero',
  HID: 'Hidalgo',
  JAL: 'Jalisco',
  MEX: 'México',
  MIC: 'Michoacán de Ocampo',
  MOR: 'Morelos',
  NAY: 'Nayarit',
  NLE: 'Nuevo León',
  OAX: 'Oaxaca',
  PUE: 'Puebla',
  QUE: 'Querétaro',
  ROO: 'Quintana Roo',
  SLP: 'San Luis Potosí',
  SIN: 'Sinaloa',
  SON: 'Sonora',
  TAB: 'Tabasco',
  TAM: 'Tamaulipas',
  TLA: 'Tlaxcala',
  VER: 'Veracruz de Ignacio de la Llave',
  YUC: 'Yucatán',
  ZAC: 'Zacatecas',
};

const PREFERRED_CARRIERS = new Set([
  'dhl',
  'fedex',
  'paquetexpress',
  'estafeta',
  'ups',
]);

export async function getShippingRates(options, context = {}) {
  const currency = context?.currency || 'MXN';
  const destination = normalizeWixAddress(options?.shippingDestination);
  const origin = normalizeWixAddress(options?.shippingOrigin);

  // Guaurritas national shipping only.
  if (destination.country && destination.country !== 'MX') {
    return { shippingRates: [] };
  }

  // On the cart Wix may not have the complete address yet. Do not block checkout.
  if (!destination.postalCode || !destination.city) {
    return fallbackResponse(currency);
  }

  try {
    const parcel = buildParcel(options?.lineItems || [], options?.weightUnit);
    const token = await getAccessToken();

    const quotation = await postJson(
      `${SKYDROPX_API}/api/v2/quotations`,
      {
        quotation: {
          address_from: toSkydropxAddress(origin, 'León'),
          address_to: toSkydropxAddress(destination),
          parcels: [parcel],
        },
      },
      token
    );

    let rates = extractRates(quotation);

    // SkydropX quotations can complete progressively. Poll briefly when needed,
    // staying below the 2 requests/second API limit and Wix's 10s plugin timeout.
    if ((!quotation?.is_completed || rates.length === 0) && quotation?.id) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await sleep(650);
        const refreshed = await getJson(
          `${SKYDROPX_API}/api/v1/quotations/${quotation.id}`,
          token
        );
        rates = mergeRates(rates, extractRates(refreshed));
        if (rates.length > 0 && refreshed?.is_completed) break;
      }
    }

    const selected = selectCustomerRates(rates);

    if (selected.length === 0) {
      console.warn('SkydropX returned no usable MXN rates. Using fallback.');
      return fallbackResponse(currency);
    }

    return {
      shippingRates: selected.map((rate) => ({
        // Keeping the SkydropX rate ID in the Wix shipping code lets us reuse it
        // later when we automate label creation after payment.
        code: `sdx:${rate.id}`,
        title: buildRateTitle(rate),
        logistics: {
          deliveryTime: formatDeliveryTime(rate.days),
        },
        cost: {
          price: toMoney(rate.total ?? rate.amount),
          currency,
        },
      })),
    };
  } catch (error) {
    console.error('SkydropX direct shipping error:', error);
    return fallbackResponse(currency);
  }
}

function fallbackResponse(currency) {
  return {
    shippingRates: [
      {
        code: 'guaurritas-standard-fallback',
        title: 'Envío estándar',
        logistics: {
          deliveryTime: FALLBACK_DAYS,
        },
        cost: {
          price: FALLBACK_PRICE,
          currency,
        },
      },
    ],
  };
}

async function getAccessToken(forceRefresh = false) {
  const now = Date.now();

  if (!forceRefresh && tokenCache.value && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.value;
  }

  const [clientIdResult, clientSecretResult] = await Promise.all([
    getSecretValueElevated('SKYDROPX_CLIENT_ID'),
    getSecretValueElevated('SKYDROPX_CLIENT_SECRET'),
  ]);

  const clientId = readSecretValue(clientIdResult);
  const clientSecret = readSecretValue(clientSecretResult);

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing SKYDROPX_CLIENT_ID or SKYDROPX_CLIENT_SECRET in Wix Secrets Manager.'
    );
  }

  const body = [
    'grant_type=client_credentials',
    `client_id=${encodeURIComponent(clientId)}`,
    `client_secret=${encodeURIComponent(clientSecret)}`,
  ].join('&');

  const response = await fetch(`${SKYDROPX_API}/api/v1/oauth/token`, {
    method: 'post',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      `SkydropX OAuth failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }

  const accessToken = payload?.access_token;
  if (!accessToken) {
    throw new Error('SkydropX OAuth response did not include access_token.');
  }

  const expiresInSeconds = Number(payload?.expires_in || 7200);
  tokenCache = {
    value: accessToken,
    expiresAt: now + expiresInSeconds * 1000,
  };

  return accessToken;
}

function readSecretValue(result) {
  if (typeof result === 'string') return result;
  return result?.value || '';
}

async function postJson(url, body, token) {
  const response = await fetch(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await parseResponse(response);

  if (response.status === 401) {
    tokenCache = { value: null, expiresAt: 0 };
    const freshToken = await getAccessToken(true);
    const retry = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${freshToken}`,
      },
      body: JSON.stringify(body),
    });
    const retryPayload = await parseResponse(retry);
    if (!retry.ok) {
      throw new Error(
        `SkydropX quotation failed (${retry.status}): ${JSON.stringify(retryPayload)}`
      );
    }
    return retryPayload;
  }

  if (!response.ok) {
    throw new Error(
      `SkydropX quotation failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function getJson(url, token) {
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(
      `SkydropX quotation refresh failed (${response.status}): ${JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_) {
    return { raw: text };
  }
}

function normalizeWixAddress(raw) {
  const address = raw?.address || raw || {};
  const subdivisionRaw = String(address.subdivision || '').replace(/^MX-/, '');
  const subdivision =
    MX_SUBDIVISIONS[subdivisionRaw] ||
    address.subdivisionFullname ||
    address.subdivision ||
    '';

  return {
    country: String(address.country || 'MX').toUpperCase(),
    postalCode: String(address.postalCode || '').trim(),
    subdivision,
    city: String(address.city || '').trim(),
    addressLine1: String(
      address.addressLine1 ||
        address.addressLine ||
        joinStreetAddress(address.streetAddress) ||
        ''
    ).trim(),
    addressLine2: String(address.addressLine2 || '').trim(),
  };
}

function joinStreetAddress(streetAddress) {
  if (!streetAddress) return '';
  return [streetAddress.name, streetAddress.number].filter(Boolean).join(' ');
}

function toSkydropxAddress(address, cityFallback = '') {
  const city = address.city || cityFallback || 'León';
  const subdivision = address.subdivision || 'Guanajuato';

  return {
    country_code: address.country || 'MX',
    postal_code: address.postalCode || '37138',
    area_level1: subdivision,
    area_level2: city,
    // SkydropX requires area_level3 for national quotes. Wix doesn't expose a
    // dedicated colonia field here, so use the most specific available text.
    area_level3:
      address.addressLine2 ||
      address.addressLine1 ||
      city,
  };
}

function buildParcel(lineItems, weightUnit) {
  const totalWeightKg = Math.max(
    0.05,
    lineItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 1);
      const rawWeight = Number(item?.physicalProperties?.weight || 0.2);
      const weightKg =
        String(weightUnit || 'KG').toUpperCase() === 'LB'
          ? rawWeight * 0.453592
          : rawWeight;
      return sum + weightKg * quantity;
    }, 0)
  );

  const declaredValue = Math.max(
    1,
    lineItems.reduce((sum, item) => {
      const quantity = Number(item?.quantity || 1);
      const total = Number(item?.totalPrice);
      const unit = Number(item?.price);
      if (Number.isFinite(total) && total > 0) return sum + total;
      if (Number.isFinite(unit) && unit > 0) return sum + unit * quantity;
      return sum;
    }, 0)
  );

  const dimensions = dimensionsForWeight(totalWeightKg);

  return {
    ...dimensions,
    weight: round(totalWeightKg, 3),
    package_protected: false,
    declared_value: round(declaredValue, 2),
  };
}

function dimensionsForWeight(weightKg) {
  if (weightKg <= 0.5) return { length: 20, width: 15, height: 8 };
  if (weightKg <= 1) return { length: 25, width: 20, height: 12 };
  if (weightKg <= 2) return { length: 30, width: 25, height: 15 };
  if (weightKg <= 3) return { length: 35, width: 28, height: 18 };
  if (weightKg <= 5) return { length: 40, width: 30, height: 20 };
  if (weightKg <= 10) return { length: 45, width: 35, height: 25 };
  return { length: 50, width: 40, height: 30 };
}

function extractRates(payload) {
  const found = [];

  function walk(node) {
    if (!node) return;

    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }

    if (typeof node !== 'object') return;

    const candidate =
      node.attributes && typeof node.attributes === 'object'
        ? { id: node.id || node.attributes.id, ...node.attributes }
        : node;

    if (
      candidate?.provider_name &&
      candidate?.success !== false &&
      (candidate?.total != null || candidate?.amount != null)
    ) {
      found.push(candidate);
    }

    Object.values(node).forEach(walk);
  }

  walk(payload);
  return mergeRates([], found);
}

function mergeRates(current, incoming) {
  const map = new Map();

  [...current, ...incoming].forEach((rate) => {
    const key =
      rate?.id ||
      [
        rate?.provider_name,
        rate?.provider_service_code || rate?.provider_service_name,
        rate?.total || rate?.amount,
      ].join('|');

    if (key && !map.has(key)) map.set(key, rate);
  });

  return [...map.values()];
}

function selectCustomerRates(rates) {
  const valid = rates
    .filter((rate) => {
      const amount = Number(rate?.total ?? rate?.amount);
      const currency = String(rate?.currency_code || 'MXN').toUpperCase();
      return Number.isFinite(amount) && amount > 0 && currency === 'MXN';
    })
    .sort(
      (a, b) =>
        Number(a?.total ?? a?.amount) - Number(b?.total ?? b?.amount)
    );

  const preferred = valid.filter((rate) =>
    PREFERRED_CARRIERS.has(String(rate?.provider_name || '').toLowerCase())
  );

  const pool = preferred.length ? preferred : valid;

  // Show the cheapest service from each carrier so the customer gets useful
  // variety instead of 4 nearly identical options from one carrier.
  const byCarrier = new Map();
  for (const rate of pool) {
    const carrier = String(rate?.provider_name || 'carrier').toLowerCase();
    if (!byCarrier.has(carrier)) byCarrier.set(carrier, rate);
  }

  return [...byCarrier.values()].slice(0, 4);
}

function buildRateTitle(rate) {
  const carrier =
    rate?.provider_display_name ||
    rate?.provider_name ||
    'Paquetería';
  const service =
    rate?.provider_service_name ||
    rate?.provider_service_code ||
    'Estándar';

  return `${carrier} · ${service}`;
}

function formatDeliveryTime(days) {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 'Entrega estimada por paquetería';
  }
  return parsed === 1 ? '1 día hábil' : `${parsed} días hábiles`;
}

function toMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount.toFixed(2) : FALLBACK_PRICE;
}

function round(value, decimals) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
