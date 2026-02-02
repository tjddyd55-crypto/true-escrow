export async function createLemonCheckout() {
  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LEMON_API_KEY}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        relationships: {
          store: {
            data: { type: "stores", id: process.env.LEMON_STORE_ID },
          },
          variant: {
            data: { type: "variants", id: process.env.LEMON_VARIANT_ID },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    let errorMessage = "Lemon API error";
    
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.errors && errorJson.errors.length > 0) {
        errorMessage = errorJson.errors[0].detail || errorJson.errors[0].title || errorMessage;
      }
    } catch {
      errorMessage = errorText || `HTTP ${res.status}`;
    }

    throw new Error(`Lemon API error (${res.status}): ${errorMessage}`);
  }

  const json = await res.json();
  return json.data.attributes.url;
}

// 하위 호환성을 위한 별칭
export const createCheckout = createLemonCheckout;
