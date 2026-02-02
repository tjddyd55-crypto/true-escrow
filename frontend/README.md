# Trust Escrow Frontend

Frontend application for Trust & Escrow platform built with Next.js.

## Prerequisites

- Node.js 18+ 
- npm or yarn

## Environment Variables

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

## Installation

```bash
cd frontend
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── deals/        # Deal detail pages
│   │   ├── admin/        # Admin pages
│   │   └── i18n-demo/    # i18n demonstration
│   ├── components/       # React components
│   │   └── deal/         # Deal-related components
│   ├── lib/              # Utilities and helpers
│   │   └── api/          # API client and hooks
│   └── i18n/             # Internationalization
│       ├── locales/      # Translation files (ko.json, en.json)
│       ├── loader.ts     # Translation loader
│       └── types.ts      # TypeScript types
├── public/               # Static assets
└── package.json
```

## Key Features

- **i18n Support**: Korean (default) and English
- **State Machine UI**: Timeline visualization with state transitions
- **Role-Based Actions**: Actions shown based on user role and deal state
- **Evidence Management**: Upload and manage evidence metadata
- **Admin Operations**: Constrained dispute resolution
- **API Integration**: Full backend integration with error handling

## API Integration

The frontend communicates with the backend API at `NEXT_PUBLIC_API_URL`.

See `/src/lib/api/client.ts` for all available API methods.

## i18n

- Canonical keys remain English in code
- UI labels are locale-based (ko/en)
- Locale stored in cookie, default: ko
- See `/src/i18n/` for translation structure

## Security

- Role-based route protection (to be implemented with auth)
- Admin routes require OPERATOR role
- Frontend validates actions before API calls (backend is safety net)

## Performance

- No excessive polling (refetch on mutation)
- Timeline pagination for large datasets (if needed)
- Optimistic updates only where safe

## Observability

- Error logging for API failures
- Mutation error tracking
- Timeline fetch monitoring

## Troubleshooting

### API Connection Issues

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running on expected port
3. Verify CORS settings on backend

### i18n Issues

1. Check locale cookie is set correctly
2. Verify translation files exist in `/src/i18n/locales/`
3. Check browser console for missing translation warnings

### State/Action Issues

1. Verify deal state matches expected state
2. Check user role is correct
3. Review FRONTEND_INTEGRATION_CONTRACT.md for allowed actions
