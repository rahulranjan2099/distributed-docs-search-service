import client from "../config/elastic.js";
import redis from "../config/redis.js";

// /search?q={query}&tenant={tenantId}
const searchDocs = async (req, res) => {
  try {
    const { q, tenant_id, id, file_name } = req.query;

    if (!q && !tenant_id && !id && !file_name) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one search parameter",
      });
    }

    if ((q || file_name) && !tenant_id && !id) {
      return res.status(400).json({
        success: false,
        message:
          "Tenant ID or ID is required when searching by file_name",
      });
    }

    // ---------------- CACHE ----------------
    let cacheKey = "search:";
    let isCacheable = false;

    if (tenant_id) {
      cacheKey += `${tenant_id}`;
      isCacheable = true;
    } else {
      cacheKey += "all";
    }

    if (q) {
      cacheKey += `:${q}`;
      isCacheable = true;
    } else if (file_name) {
      cacheKey += `:${file_name}`;
      isCacheable = true;
    }

    if (isCacheable) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        console.log("✅ Cache HIT");
        return res.status(200).json({
          message: 'Fetched from Redis',
          data: JSON.parse(cached)
        });
      }
      console.log("❌ Cache MISS");
    }

    // ---------------- QUERY BUILD ----------------
    const must = [];
    const filter = [];

    //  TEXT SEARCH (fuzzy + prefix)
    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["file_name"],
          fuzziness: "AUTO",        //  fuzzy search
          operator: "and"
        },
      });

      // optional: prefix boost (fast autocomplete feel)
      must.push({
        match_phrase_prefix: {
          file_name: {
            query: q,
            boost: 2, // rank higher
          },
        },
      });
    }

    // exact-ish match (but still analyzed)
    if (file_name) {
      must.push({
        match: {
          file_name: {
            query: file_name,
            fuzziness: "AUTO", // also fuzzy here
          },
        },
      });
    }

    //  FILTERS (fast, no scoring)
    if (id) {
      filter.push({
        term: { id: Number(id) },
      });
    }

    if (tenant_id) {
      filter.push({
        term: { tenant_id: Number(tenant_id) },
      });
    }

    // ---------------- ELASTIC QUERY ----------------
    const esQuery = {
      bool: {},
    };

    if (must.length) esQuery.bool.must = must;
    if (filter.length) esQuery.bool.filter = filter;

    const result = await client.search({
      index: "documents",
      query: esQuery,
    });

    const response = {
      success: true,
      total: result.hits.total.value,
      data: result.hits.hits.map((hit) => ({
        id: hit._id,
        ...hit._source,
      })),
    };

    // ---------------- CACHE STORE ----------------
    if (isCacheable) {
      const payload = JSON.stringify(response);

      // avoid caching huge responses 500 kb
      if (Buffer.byteLength(payload) < 500 * 1024) {
        await redis.set(cacheKey, payload, { EX: 60 });
        console.log("✅ Cache SET");
      }
    }

    return res.status(200).json({message:'Fetched from elastic search', data: response});
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ success: false });
  }
};
export { searchDocs };
