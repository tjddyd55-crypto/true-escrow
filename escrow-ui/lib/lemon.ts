export async function createLemonCheckout() {
  console.log("===== LEMON CHECKOUT API CALL START =====");
  
  // 1) 실제 호출 URL 전체 (문자열 그대로)
  const apiUrl = "https://api.lemonsqueezy.com/v1/checkouts";
  console.log("1) API URL (전체 문자열):", apiUrl);
  console.log("   - URL 확인:", apiUrl === "https://api.lemonsqueezy.com/v1/checkouts" ? "✅ 정확함" : "❌ 불일치");
  
  // 2) process.env.LEMON_API_KEY 존재 여부
  const apiKey = process.env.LEMON_API_KEY;
  const apiKeyExists = apiKey != null && apiKey !== undefined && apiKey.length > 0;
  console.log("2) process.env.LEMON_API_KEY 존재 여부:", apiKeyExists ? "✅ 존재" : "❌ 없음");
  console.log("   - 값:", apiKeyExists ? `"${apiKey.substring(0, 20)}..." (길이: ${apiKey.length})` : "undefined 또는 빈 문자열");
  
  // 3) process.env.LEMON_API_KEY prefix (sk_test_ 인지)
  let apiKeyPrefix = "none";
  if (apiKeyExists) {
    if (apiKey.startsWith("sk_test_")) {
      apiKeyPrefix = "sk_test_";
    } else if (apiKey.startsWith("sk_live_")) {
      apiKeyPrefix = "sk_live_";
    } else {
      apiKeyPrefix = `unknown (시작: "${apiKey.substring(0, Math.min(10, apiKey.length))}")`;
    }
  }
  console.log("3) process.env.LEMON_API_KEY prefix:", apiKeyPrefix);
  console.log("   - sk_test_ 확인:", apiKeyPrefix === "sk_test_" ? "✅ 맞음" : "❌ 아님");
  
  // 4) headers 전체 (Authorization 값은 prefix만)
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  const headersForLog = {
    Authorization: apiKeyExists ? `Bearer ${apiKeyPrefix}...` : "Bearer (missing)",
    Accept: headers.Accept,
    "Content-Type": headers["Content-Type"],
  };
  console.log("4) Headers 전체:");
  console.log("   ", JSON.stringify(headersForLog, null, 2));
  console.log("   - Authorization 헤더 존재:", headers.Authorization ? "✅ 있음" : "❌ 없음");
  console.log("   - Authorization prefix:", apiKeyPrefix);
  
  // Request body 준비
  const storeId = process.env.LEMON_STORE_ID;
  const variantId = process.env.LEMON_VARIANT_ID;
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
  console.log("   - Request Body:", JSON.stringify(requestBody, null, 2));
  console.log("   - store_id:", storeId || "(missing)");
  console.log("   - variant_id:", variantId || "(missing)");
  
  try {
    console.log("5) Fetch 호출 시작...");
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    // 5) Lemon API response status + response body
    console.log("6) Response Status:", res.status, res.statusText);
    console.log("   - Status 확인:", res.status === 200 ? "✅ 성공" : `❌ 에러 (${res.status})`);
    
    const responseText = await res.text();
    console.log("7) Response Body (전체):", responseText);
    
    // Response body 파싱 시도
    try {
      const responseJson = JSON.parse(responseText);
      console.log("8) Response Body (파싱됨):", JSON.stringify(responseJson, null, 2));
      
      if (!res.ok) {
        if (responseJson.errors && responseJson.errors.length > 0) {
          console.log("9) 에러 상세:");
          responseJson.errors.forEach((err: any, idx: number) => {
            console.log(`   - Error ${idx + 1}:`, err);
          });
        }
        console.error("===== LEMON CHECKOUT API ERROR =====");
        const errorMessage = responseJson.errors?.[0]?.detail || 
                           responseJson.errors?.[0]?.title || 
                           `HTTP ${res.status}`;
        throw new Error(`Lemon API error (${res.status}): ${errorMessage}`);
      }
      
      const checkoutUrl = responseJson.data?.attributes?.url;
      console.log("9) Checkout URL:", checkoutUrl || "(not found in response)");
      console.log("===== LEMON CHECKOUT API SUCCESS =====");
      
      return checkoutUrl;
    } catch (parseError) {
      console.error("8) Response Body 파싱 실패:", parseError);
      console.error("   - Raw Response:", responseText);
      throw new Error(`Failed to parse response (${res.status}): ${responseText}`);
    }
  } catch (error) {
    console.error("===== LEMON CHECKOUT API EXCEPTION =====");
    console.error("Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw error;
  }
}

// 하위 호환성을 위한 별칭
export const createCheckout = createLemonCheckout;
