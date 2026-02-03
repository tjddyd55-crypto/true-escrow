export async function createLemonCheckout() {
  // 1) 실제 호출 URL (전체 문자열)
  const apiUrl = "https://api.lemonsqueezy.com/v1/checkouts";
  console.log("===== LEMON CHECKOUT API CALL =====");
  console.log("1) API URL:", apiUrl);
  
  // 2) Authorization 헤더 존재 여부와 prefix 확인
  const apiKey = process.env.LEMON_API_KEY;
  const hasAuth = apiKey != null && apiKey.length > 0;
  const authPrefix = apiKey ? (apiKey.startsWith("sk_test_") ? "sk_test_" : 
                                apiKey.startsWith("sk_live_") ? "sk_live_" : 
                                "unknown") : "none";
  console.log("2) Authorization Header:");
  console.log("   - Exists:", hasAuth);
  console.log("   - Prefix:", authPrefix);
  console.log("   - Key length:", apiKey ? apiKey.length : 0);
  console.log("   - Key preview:", apiKey ? `${apiKey.substring(0, 10)}...` : "N/A");
  
  // 3) store_id, variant_id 실제 값
  const storeId = process.env.LEMON_STORE_ID;
  const variantId = process.env.LEMON_VARIANT_ID;
  console.log("3) Request Parameters:");
  console.log("   - store_id:", storeId || "(missing)");
  console.log("   - variant_id:", variantId || "(missing)");
  
  const requestBody = {
    data: {
      type: "checkouts",
      relationships: {
        store: {
          data: { type: "stores", id: storeId },
        },
        variant: {
          data: { type: "variants", id: variantId },
        },
      },
    },
  };
  
  console.log("4) Request Body:", JSON.stringify(requestBody, null, 2));
  
  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // 4) Lemon API response status + response body (에러 포함)
    console.log("5) Response Status:", res.status, res.statusText);
    
    const responseText = await res.text();
    console.log("6) Response Body:", responseText);
    
    if (!res.ok) {
      let errorMessage = "Lemon API error";
      
      try {
        const errorJson = JSON.parse(responseText);
        if (errorJson.errors && errorJson.errors.length > 0) {
          errorMessage = errorJson.errors[0].detail || errorJson.errors[0].title || errorMessage;
          console.log("7) Parsed Error:", errorJson);
        }
      } catch {
        errorMessage = responseText || `HTTP ${res.status}`;
      }

      console.error("===== LEMON CHECKOUT API ERROR =====");
      throw new Error(`Lemon API error (${res.status}): ${errorMessage}`);
    }

    const json = JSON.parse(responseText);
    console.log("7) Parsed Response:", json);
    console.log("8) Checkout URL:", json.data?.attributes?.url || "(not found)");
    console.log("===== LEMON CHECKOUT API SUCCESS =====");
    
    return json.data.attributes.url;
  } catch (error) {
    console.error("===== LEMON CHECKOUT API EXCEPTION =====");
    console.error("Error:", error);
    throw error;
  }
}

// 하위 호환성을 위한 별칭
export const createCheckout = createLemonCheckout;
