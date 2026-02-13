# PDF 한글 폰트 (Noto Sans KR)

PDF에서 한글이 깨지지 않도록 Noto Sans KR TTF를 이 폴더에 넣어주세요.

## 다운로드

1. **Google Fonts**  
   https://fonts.google.com/noto/specimen/Noto+Sans+KR  
   → "Download family" 후 압축 해제.

2. **직접 링크 (Static)**  
   - Noto Sans KR Regular:  
     https://github.com/google/fonts/raw/main/ofl/notosanskr/NotoSansKR-Regular.ttf  
   - 위 파일을 다운로드하여 이 폴더에 `NotoSansKR-Regular.ttf` 로 저장.

3. **선택: 영문용**  
   `NotoSans-Regular.ttf` 를 같은 방식으로 추가하면 영문도 동일 폰트로 통일 가능.

## 필수 파일

- `NotoSansKR-Regular.ttf` — 없으면 PDF는 Helvetica로 출력되며 한글이 □□□로 나올 수 있음.

## 빌드 포함

`next.config.ts` 의 `outputFileTracingIncludes` 로 이 폴더가 standalone 빌드에 포함됩니다.  
Railway 등에서도 동일 경로(`process.cwd()/assets/fonts/...`)로 접근합니다.
