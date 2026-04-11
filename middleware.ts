import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // If the request points to /admin/dashboard (or sub-paths)
    if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
        const authCookie = request.cookies.get('nearfix_admin_auth');
        
        // Block request and redirect to login if no auth cookie is present
        if (!authCookie || authCookie.value !== 'true') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/dashboard/:path*'],
};
