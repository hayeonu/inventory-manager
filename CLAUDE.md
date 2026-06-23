# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 실행
```

## Environment

`.env.local` 파일에 아래 두 값이 필요합니다 (Google 서비스 계정):

```
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Architecture

Google Sheets를 데이터베이스로 사용하는 Next.js 16 App Router 앱입니다.

**데이터 흐름**

- `src/lib/sheets.ts` — 서버 전용. `googleapis`로 Google Sheets API를 호출. `getInventoryData()`(읽기)와 `appendTransaction()`(쓰기) 두 함수만 공개.
- `src/app/page.tsx` — Server Component. `getInventoryData()`를 직접 await해서 재고 현황 테이블 렌더링.
- `src/app/actions.ts` — `'use server'` Server Action. 폼 제출 시 전표번호 생성·금액 계산 후 `appendTransaction()` 호출, `revalidatePath('/')`로 페이지 갱신.
- `src/components/AddTransactionForm.tsx` — `'use client'` 모달 폼. `useActionState`로 Server Action 연결.

**중요한 분리 규칙**

`googleapis`는 Node.js 내장 모듈(`child_process` 등)을 사용하므로 클라이언트 번들에 포함되면 빌드 오류가 납니다. 이를 막기 위해:

- `src/lib/constants.ts` — 제품 목록(`PRODUCTS`)·담당자 목록(`MANAGERS`) 상수만 보관. `googleapis` import 없음. 클라이언트 컴포넌트에서 이 파일만 import해야 합니다.
- `src/lib/sheets.ts` — `googleapis` import 있음. 서버 컴포넌트·Server Action에서만 import.
- `next.config.ts` — `serverExternalPackages: ['googleapis']` 설정 필수.

**Google Sheets 구조** (스프레드시트 ID: `1PapqKYFmKefzI2X_61a6wg1yAohWBYlQLdbHK5ZyGLg`, gid: `28595725`)

시트 하나에 세 개의 테이블이 수직으로 배치되어 있습니다:
1. 재고 현황 (A1:R9) — PRD001~PRD008 월별 입출고 요약
2. 제품 정보 — 판매단가·원가·마진율
3. 거래 내역 — 날짜·전표번호·제품·구분·수량·단가·금액·거래처·담당자·비고 (11컬럼, 월별로 구분)

`appendTransaction()`은 시트 끝에 행을 추가(`values.append`)하므로 거래 내역 섹션에 기록됩니다. 재고 현황 합계가 수식 기반이면 자동 반영됩니다.
