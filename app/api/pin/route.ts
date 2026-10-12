/**
 * POST /api/pin — pins an agent logo + metadata JSON to Pinata (IPFS).
 *
 * The JWT never reaches the browser: it is read here, server-side, from
 * PINATA_JWT. The client only ever sees the returned ipfs:// URI.
 */

const PINATA_FILE_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PINATA_JSON_URL = "https://api.pinata.cloud/pinning/pinJSONToIPFS";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function POST(request: Request): Promise<Response> {
  const jwt = process.env.PINATA_JWT?.trim();
  if (!jwt) {
    return Response.json(
      { error: "PINATA_JWT is not set on the server. Add it to .env.local and restart the dev server." },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const name = String(form.get("name") ?? "").trim();
  const description = String(form.get("description") ?? "").trim();
  const endpoint = String(form.get("endpoint") ?? "").trim();
  const image = form.get("image");

  if (!name) {
    return Response.json({ error: "Missing agent name." }, { status: 400 });
  }

  let imageCid: string | null = null;

  if (image instanceof File && image.size > 0) {
    if (!ALLOWED_TYPES.has(image.type)) {
      return Response.json({ error: "Use a PNG, JPEG, WebP or GIF." }, { status: 400 });
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Logo must be 2 MB or smaller." }, { status: 400 });
    }

    const pinFile = new FormData();
    pinFile.append("file", image, image.name || "logo.png");
    pinFile.append("pinataMetadata", JSON.stringify({ name: `agentns-logo-${name}` }));

    const fileRes = await fetch(PINATA_FILE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: pinFile,
    });
    const fileJson = (await fileRes.json().catch(() => ({}))) as {
      IpfsHash?: string;
      error?: string;
    };
    if (!fileRes.ok || !fileJson.IpfsHash) {
      return Response.json(
        { error: fileJson.error ?? `Pinata image upload failed (${fileRes.status}).` },
        { status: 502 },
      );
    }
    imageCid = fileJson.IpfsHash;
  }

  const metadata = {
    name,
    description: description || undefined,
    image: imageCid ? `ipfs://${imageCid}` : undefined,
    external_url: endpoint || undefined,
    attributes: endpoint ? [{ trait_type: "endpoint", value: endpoint }] : undefined,
  };

  const jsonRes = await fetch(PINATA_JSON_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `agentns-meta-${name}` },
    }),
  });
  const json = (await jsonRes.json().catch(() => ({}))) as {
    IpfsHash?: string;
    error?: string;
  };
  if (!jsonRes.ok || !json.IpfsHash) {
    return Response.json(
      { error: json.error ?? `Pinata metadata pin failed (${jsonRes.status}).` },
      { status: 502 },
    );
  }

  return Response.json({ uri: `ipfs://${json.IpfsHash}` });
}
