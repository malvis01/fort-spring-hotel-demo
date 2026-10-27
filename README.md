# Fort Spring Hotel & Suites — Website Concept

A mobile-responsive hotel website concept by Malvis Digital, prepared for management review. This is not yet an official hotel website.

## Stack
- Static HTML, CSS and JavaScript
- Supabase for room data and booking requests
- GitHub for source control
- Planned Netlify hosting after testing and approval

## Supabase project
- Project ref: `xvgdsdklugcplomhokpc`
- URL: `https://xvgdsdklugcplomhokpc.supabase.co`
- Browser config uses a publishable key only. Never commit service-role keys, passwords, or other secrets.

## Current features
- Responsive landing page and sample room cards
- Room listing reads published rooms from `fs_rooms`
- Booking form submits a pending request to `fs_bookings`
- Database calculates nightly price and total based on the current room rate
- RLS enabled on all five `fs_*` tables
- No payments or confirmed reservations are performed by this demo

## Before real use
1. Verify all hotel details, phone, address, room names, rates, capacity, photos, amenities, check-in and check-out times with hotel management.
2. Create the authorized admin user through Supabase Auth, then add that user's UUID to `public.fs_admin_users` using the SQL editor. Do not put admin passwords in source code.
3. Build and test a separate authenticated admin dashboard. Test access controls with anonymous, normal authenticated, and admin accounts.
4. Review database policies and booking abuse/rate-limit protections before accepting public traffic.
5. Test the full booking workflow, mobile layouts, and accessibility.
6. Deploy to Netlify only after owner approval.

## Sample room data
The database intentionally has no invented room prices or room inventory. Hotel management must provide accurate details before rooms are published.

## Important
This repository currently contains public-safe frontend configuration only. A publishable/anon key is designed for browser use and relies on correct RLS policies. Never expose a Supabase service-role key.
