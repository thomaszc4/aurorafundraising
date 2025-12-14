-- Create a function to help promote a user since we can't easily guess their ID
-- Usage: Run this in Supabase SQL Editor

-- 1. Check if user exists (Optional debugging)
select * from auth.users where email = 'admin@test.com';

-- 2. Insert into user_roles
-- Note: You can replace 'admin@test.com' with the target email
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role
from auth.users
where email = 'admin@test.com'
on conflict (id) do nothing; -- or update if ID is primary key? user_roles PK is 'id' (uuid), user_id is FK. 

-- Wait, user_roles PK is a separate ID. The UNIQUE constraint might be on user_id?
-- Let's check constraints. If not, we might duplicate.
-- Safer:
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role
from auth.users
where email = 'admin@test.com'
and not exists (
  select 1 from public.user_roles 
  where user_id = auth.users.id 
  and role = 'admin'
);
