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

## Food ordering setup\nThe menu is intentionally empty until hotel management supplies the real menu and prices. An authorized admin can add items to \`public.fs_restaurant_menu\` and set \`is_available = true\` when ready to sell. The existing \`category\` constraint accepts Food, Drinks, Bar, Dessert, and Sides. Orders are stored in \`fs_food_orders\` and \`fs_food_order_items\`; requests begin as pending and use pay-at-hotel as the demo payment status. Do not mark an order accepted until staff confirms stock, preparation time, and delivery/dine-in details.\n\n## Sample room data
The database intentionally has no invented room prices or room inventory. Hotel management must provide accurate details before rooms are published.

## Important
This repository currently contains public-safe frontend configuration only. A publishable/anon key is designed for browser use and relies on correct RLS policies. Never expose a Supabase service-role key.


## Hotel administrator dashboard

Open `admin.html` to access the staff dashboard. The dashboard supports:
- reviewing room booking requests and updating booking status/internal notes;
- reviewing restaurant/bar orders and updating their workflow status;
- adding/editing menu items, prices, descriptions, images, and availability;
- adding/editing room categories, rates, capacity, amenities, photos, and publication status.

### Provision the first administrator safely

1. In the Supabase project dashboard for `fort-spring-hotel-demo`, open **Authentication → Users** and create an administrator account with an email address and a strong unique password. Do not reuse a password from another project.
2. Copy that account's Auth user UUID.
3. Open the Supabase SQL Editor and run the following, replacing the example UUID and display name with the account you just created:

```sql
insert into public.fs_admin_users (user_id, display_name)
values ('REPLACE-WITH-AUTH-USER-UUID', 'Hotel Administrator')
on conflict (user_id) do update
set display_name = excluded.display_name;
```

4. Sign in at `admin.html` using that account. Only users present in `fs_admin_users` are authorized. Do not expose the database service-role key or place it in website files.

The admin dashboard uses the Supabase publishable key only. Table access is governed by Row Level Security (RLS). Do not use real guest information until the hotel approves the site and the access rules have been reviewed and tested.

## Important demo limits

- Hotel room categories, menu items, prices, photos, and operational details must be supplied/confirmed by hotel management.
- Online payment processing is not enabled. Restaurant/bar orders use a pay-at-hotel workflow for now.
- Staff must review and accept a request; a submitted booking or food order is not an automatic confirmation.
- Before public launch, test account provisioning, all status updates, mobile layout, validation, database policies, and real-world operational handling.
- Deploy to Netlify only after the owner has reviewed and approved the finished site.
