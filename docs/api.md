# TailorConnect — REST API Contract

## Base URL
`/api/v1`

## Standard Envelope
- Success: `{ "success": true, "data": ..., "meta": ... }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": [...] } }`

## Core Modules
- `/auth`: Registration, Login, Token refresh, Current session (`/me`)
- `/businesses`: Profile, Capability configuration, Portfolio upload, Working hours
- `/services`: Taxonomy categories (Women's, Men's, Kids, Specialty) and Garments
- `/discovery`: Nearby matching tailors with explainable match reasons
- `/ai-matching/extract`: Natural language requirement parser
- `/requests`: Stitching requests, Reference photos, Contextual Q&A
- `/quotes`: Itemized quote builder, Quote acceptance & decline
- `/orders`: Order management, Server-authoritative status advance, Timeline history
- `/appointments`: Time-slot availability, Booking, Appointment lifecycle
- `/payments`: Payment intent creation, Offline cash/UPI receipt recording
- `/reviews`: Order-verified customer reviews & ratings rollup
- `/admin`: Studio verification queue, Marketplace health metrics, Order inspection
