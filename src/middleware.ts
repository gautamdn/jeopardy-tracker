// src/middleware.ts or middleware.ts at the root

import { NextRequest, NextResponse } from 'next/server';

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASS = process.env.AUTH_PASS;

export function middleware(req: NextRequest) {
  const auth = req.headers.get('authorization');

  if (auth) {
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');

    if (user === AUTH_USER && pass === AUTH_PASS) {
      return NextResponse.next(); // Allow the request to proceed
    }
  }

  // If authentication fails or no auth is provided, respond with 401 Unauthorized
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
