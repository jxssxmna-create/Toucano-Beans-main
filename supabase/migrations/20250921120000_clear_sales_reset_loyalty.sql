-- Clear historical sales/orders and reset loyalty for a clean admin start
truncate table public.orders restart identity cascade;

update public.profiles
set loyalty_stamps = 0,
    free_bag_vouchers = 0;
