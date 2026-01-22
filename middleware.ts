// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const url = req.nextUrl.pathname;
    const userRole = token?.role as string;

    // 1. PUBLIC PAGE LOGIC
    // Redirect authenticated users away from Login/Register to their dashboard
    if (url === "/login" || url === "/register") {
      if (isAuth) {
        return NextResponse.redirect(new URL("/sadhak", req.url));
      }
      return null;
    }

    // 2. SUPERADMIN PROTECTION
    // URLs: /admin/dashboard, /admin/shlokas, /admin/motivations, etc.
    if (url.startsWith("/admin")) {
      if (userRole !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // 3. MENTOR PROTECTION
    // URLs: /mentor/groups, /mentor/requests
    if (url.startsWith("/mentor")) {
      if (userRole !== "MENTOR" && userRole !== "SUPERADMIN") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    // 4. SADHAK / TRACKER PROTECTION
    // URLs: /sadhak, /books, /challenges, /mentors, /friends, /chats
    const trackerPaths = ["/sadhak", "/books", "/challenges", "/mentors", "/friends", "/chats"];
    const isTrackerRoute = trackerPaths.some(path => url.startsWith(path));

    if (isTrackerRoute) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // If authenticated but role is somehow missing, redirect to home
      if (!userRole) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  },
  {
    callbacks: {
      // Set to true so the middleware function above always runs, 
      // allowing us to handle the logic manually.
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/mentor/:path*",
    "/sadhak/:path*",
    "/books/:path*",
    "/challenges/:path*",
    "/mentors/:path*",
    "/friends/:path*",
    "/chats/:path*",
    "/login",
    "/register"
  ],
};