export async function createCheckout() {
  // 환경 변수 검증
  const apiKey = process.env.LEMON_API_KEY;
  const storeId = process.env.LEMON_STORE_ID;
  const variantId = process.env.LEMON_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    throw new Error(
      "Lemon Squeezy credentials not configured. Please set LEMON_API_KEY, LEMON_STORE_ID, and LEMON_VARIANT_ID in .env.local"
    );
  }

  const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: "buyer@test.com",
          },
        },
        relationships: {
          store: {
            data: {
              type: "stores",
              id: storeId,
            },
          },
          variant: {
            data: {
              type: "variants",
              id: variantId,
            },
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

    if (res.status === 401) {
      throw new Error(`Lemon API authentication failed. Please check your LEMON_API_KEY in .env.local. Error: ${errorMessage}`);
    }

    throw new Error(`Lemon API error (${res.status}): ${errorMessage}`);
  }

  const json = await res.json();
  return json.data.attributes.url;
}
