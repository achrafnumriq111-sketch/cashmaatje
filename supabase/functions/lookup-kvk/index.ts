const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { query } = await req.json();
    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "query required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("KVK_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: "KVK_API_KEY niet ingesteld",
        hint: "Voeg KVK API key toe via Lovable Cloud secrets om automatische bedrijfsgegevens op te halen.",
      }), { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const isNumeric = /^\d{8}$/.test(query.trim());
    const url = isNumeric
      ? `https://api.kvk.nl/api/v1/basisprofielen/${query.trim()}`
      : `https://api.kvk.nl/api/v1/zoeken?naam=${encodeURIComponent(query)}`;
    const r = await fetch(url, { headers: { apikey: apiKey } });
    if (!r.ok) {
      return new Response(JSON.stringify({ error: `KVK API ${r.status}` }), {
        status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await r.json();
    let result;
    if (isNumeric) {
      const adr = data._embedded?.hoofdvestiging?.adressen?.[0] ?? {};
      result = {
        kvk_number: data.kvkNummer,
        name: data.naam,
        legal_name: data.statutaireNaam ?? data.naam,
        address_street: adr.straatnaam ? `${adr.straatnaam} ${adr.huisnummer ?? ""}`.trim() : null,
        address_postal_code: adr.postcode ?? null,
        address_city: adr.plaats ?? null,
        address_country: adr.land ?? "NL",
      };
    } else {
      result = (data.resultaten ?? []).slice(0, 10).map((r: any) => ({
        kvk_number: r.kvkNummer, name: r.handelsnaam, city: r.plaats,
      }));
    }
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
