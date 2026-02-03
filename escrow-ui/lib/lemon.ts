export async function createLemonCheckout(dealId?: string, milestoneId?: string) {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  
  console.log("===== LEMON CHECKOUT API CALL START =====");
  console.log(`[${requestId}] Request ID for tracing`);
  
  // 1) 실제 호출 URL 전체 (문자열 그대로)
  const apiUrl = "https://api.lemonsqueezy.com/v1/checkouts";
  console.log(`[${requestId}] 1) API URL (전체 문자열):`, apiUrl);
  console.log(`[${requestId}]    - URL 확인:`, apiUrl === "https://api.lemonsqueezy.com/v1/checkouts" ? "✅ 정확함" : "❌ 불일치");
  console.log(`[${requestId}]    - 도메인 확인:`, apiUrl.startsWith("https://api.lemonsqueezy.com") ? "✅ api.lemonsqueezy.com" : "❌ 다른 도메인");
  
  // C3) API Key trim 처리
  const rawApiKey = process.env.LEMON_API_KEY || "";
  const apiKey = rawApiKey.trim();
  const apiKeyExists = apiKey.length > 0;
  
  console.log(`[${requestId}] 2) process.env.LEMON_API_KEY 존재 여부:`, apiKeyExists ? "✅ 존재" : "❌ 없음");
  console.log(`[${requestId}]    - 원본 길이:`, rawApiKey.length);
  console.log(`[${requestId}]    - Trim 후 길이:`, apiKey.length);
  console.log(`[${requestId}]    - Trim 필요 여부:`, rawApiKey.length !== apiKey.length ? "⚠️ 공백 제거됨" : "✅ 공백 없음");
  
  // C1) API Key 모드 불일치 체크
  let apiKeyPrefix = "none";
  let keyMode = "unknown";
  if (apiKeyExists) {
    if (apiKey.startsWith("sk_test_")) {
      apiKeyPrefix = "sk_test_";
      keyMode = "test";
    } else if (apiKey.startsWith("sk_live_")) {
      apiKeyPrefix = "sk_live_";
      keyMode = "live";
    } else {
      apiKeyPrefix = `unknown (시작: "${apiKey.substring(0, Math.min(10, apiKey.length))}")`;
    }
  }
  console.log(`[${requestId}] 3) process.env.LEMON_API_KEY prefix:`, apiKeyPrefix);
  console.log(`[${requestId}]    - Key mode:`, keyMode);
  console.log(`[${requestId}]    - sk_test_ 확인:`, apiKeyPrefix === "sk_test_" ? "✅ 맞음" : "❌ 아님");
  
  // C3) Headers 규격 체크 (JSON:API) - trim 처리된 key 사용
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/vnd.api+json",
    "Content-Type": "application/vnd.api+json",
  };
  const headersForLog = {
    Authorization: apiKeyExists ? `Bearer ${apiKeyPrefix}...` : "Bearer (missing)",
    Accept: headers.Accept,
    "Content-Type": headers["Content-Type"],
  };
  console.log(`[${requestId}] 4) Headers 전체:`);
  console.log(`[${requestId}]    `, JSON.stringify(headersForLog, null, 2));
  console.log(`[${requestId}]    - Authorization 헤더 존재:`, headers.Authorization ? "✅ 있음" : "❌ 없음");
  console.log(`[${requestId}]    - Authorization prefix:`, apiKeyPrefix);
  console.log(`[${requestId}]    - Content-Type:`, headers["Content-Type"]);
  console.log(`[${requestId}]    - Accept:`, headers.Accept);
  console.log(`[${requestId}]    - Content-Type 확인:`, headers["Content-Type"] === "application/vnd.api+json" ? "✅ 맞음" : "❌ 틀림");
  console.log(`[${requestId}]    - Accept 확인:`, headers.Accept === "application/vnd.api+json" ? "✅ 맞음" : "❌ 틀림");
  
  // Request body 준비 - Lemon JSON:API 스펙에 정확히 맞춤
  const storeId = (process.env.LEMON_STORE_ID || "").trim();
  const variantId = (process.env.LEMON_VARIANT_ID || "").trim();
  
  // custom_data 준비 (dealId, milestoneId 포함)
  const customData: Record<string, string> = {};
  if (dealId) {
    customData.dealId = dealId;
  }
  if (milestoneId) {
    customData.milestoneId = milestoneId;
  }
  
  const requestBody = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          custom: customData,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: String(storeId) }, // id는 문자열로 전달
        },
        variant: {
          data: { type: "variants", id: String(variantId) }, // id는 문자열로 전달
        },
      },
    },
  };
  console.log(`[${requestId}] 5) Request Body:`);
  console.log(`[${requestId}]    `, JSON.stringify(requestBody, null, 2));
  console.log(`[${requestId}]    - store_id:`, storeId || "(missing)");
  console.log(`[${requestId}]    - variant_id:`, variantId || "(missing)");
  console.log(`[${requestId}]    - dealId:`, dealId || "(not provided)");
  console.log(`[${requestId}]    - milestoneId:`, milestoneId || "(not provided)");
  console.log(`[${requestId}]    - store_id 타입:`, typeof storeId);
  console.log(`[${requestId}]    - variant_id 타입:`, typeof variantId);
  
  try {
    console.log(`[${requestId}] 6) Fetch 호출 시작...`);
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    // Response status
    console.log(`[${requestId}] 7) Response Status:`, res.status, res.statusText);
    console.log(`[${requestId}]    - Status 확인:`, res.status === 200 ? "✅ 성공" : `❌ 에러 (${res.status})`);
    
    // B2) 항상 text로 먼저 읽기
    const responseText = await res.text();
    console.log(`[${requestId}] 8) Response Body (전체 원문):`, responseText);
    console.log(`[${requestId}]    - Response 길이:`, responseText.length, "bytes");
    
    // B2) 안전한 JSON 파싱
    let responseJson: any = null;
    let parseSuccess = false;
    try {
      responseJson = JSON.parse(responseText);
      parseSuccess = true;
      console.log(`[${requestId}] 9) Response Body (파싱 성공):`, JSON.stringify(responseJson, null, 2));
    } catch (parseError) {
      parseSuccess = false;
      console.error(`[${requestId}] 9) Response Body 파싱 실패:`, parseError);
      console.error(`[${requestId}]    - Raw Response (파싱 실패):`, responseText);
    }
    
    if (!res.ok) {
      // C) 401 원인 분기 체크리스트
      console.error(`[${requestId}] ===== LEMON CHECKOUT API ERROR (${res.status}) =====`);
      
      if (res.status === 401) {
        console.error(`[${requestId}] 401 Unauthenticated 원인 분석:`);
        
        // C1) API Key 모드 불일치 체크
        console.error(`[${requestId}] C1) API Key 모드 체크:`);
        console.error(`[${requestId}]    - Key prefix:`, apiKeyPrefix);
        console.error(`[${requestId}]    - Key mode:`, keyMode);
        console.error(`[${requestId}]    - Test mode 사용 중인가?`, keyMode === "test" ? "✅ 예" : "❌ 아니오");
        console.error(`[${requestId}]    - Live mode 사용 중인가?`, keyMode === "live" ? "✅ 예" : "❌ 아니오");
        console.error(`[${requestId}]    - ⚠️ Lemon Dashboard에서 Test mode ON/OFF와 API key 모드가 일치하는지 확인 필요`);
        
        // C2) Store/Variant 소속 불일치 체크
        console.error(`[${requestId}] C2) Store/Variant 소속 체크:`);
        console.error(`[${requestId}]    - store_id:`, storeId || "(missing)");
        console.error(`[${requestId}]    - variant_id:`, variantId || "(missing)");
        console.error(`[${requestId}]    - ⚠️ GET /v1/variants/${variantId}로 store 관계 확인 필요`);
        console.error(`[${requestId}]    - ⚠️ relationships.store.data.id와 LEMON_STORE_ID 일치 여부 확인 필요`);
        
        // C3) 헤더 규격 체크
        console.error(`[${requestId}] C3) 헤더 규격 체크:`);
        console.error(`[${requestId}]    - Content-Type:`, headers["Content-Type"]);
        console.error(`[${requestId}]    - Accept:`, headers.Accept);
        console.error(`[${requestId}]    - Authorization 존재:`, apiKeyExists ? "✅" : "❌");
        console.error(`[${requestId}]    - Authorization prefix:`, apiKeyPrefix);
        
        // C4) API 도메인/경로 체크
        console.error(`[${requestId}] C4) API 도메인/경로 체크:`);
        console.error(`[${requestId}]    - URL:`, apiUrl);
        console.error(`[${requestId}]    - 도메인:`, apiUrl.startsWith("https://api.lemonsqueezy.com") ? "✅ api.lemonsqueezy.com" : "❌ 다른 도메인");
        console.error(`[${requestId}]    - 경로:`, apiUrl.endsWith("/v1/checkouts") ? "✅ /v1/checkouts" : "❌ 다른 경로");
      }
      
      if (parseSuccess && responseJson?.errors) {
        console.error(`[${requestId}] 10) 에러 상세:`);
        responseJson.errors.forEach((err: any, idx: number) => {
          console.error(`[${requestId}]    - Error ${idx + 1}:`, JSON.stringify(err, null, 2));
        });
        const errorMessage = responseJson.errors[0]?.detail || 
                           responseJson.errors[0]?.title || 
                           `HTTP ${res.status}`;
        throw new Error(`Lemon API error (${res.status}): ${errorMessage}`);
      } else {
        // 파싱 실패 또는 에러 형식이 아닌 경우
        const errorMessage = parseSuccess 
          ? `HTTP ${res.status}` 
          : `HTTP ${res.status} (Response parse failed): ${responseText.substring(0, 200)}`;
        throw new Error(`Lemon API error: ${errorMessage}`);
      }
    }
    
    if (!parseSuccess) {
      throw new Error(`Failed to parse response (${res.status}): ${responseText.substring(0, 200)}`);
    }
    
    const checkoutUrl = responseJson.data?.attributes?.url;
    console.log(`[${requestId}] 10) Checkout URL:`, checkoutUrl || "(not found in response)");
    console.log(`[${requestId}] ===== LEMON CHECKOUT API SUCCESS =====`);
    
    return checkoutUrl;
  } catch (error) {
    console.error(`[${requestId}] ===== LEMON CHECKOUT API EXCEPTION =====`);
    console.error(`[${requestId}] Error:`, error);
    if (error instanceof Error) {
      console.error(`[${requestId}] Error message:`, error.message);
      console.error(`[${requestId}] Error stack:`, error.stack);
    }
    throw error;
  }
}

// 하위 호환성을 위한 별칭
export const createCheckout = createLemonCheckout;
