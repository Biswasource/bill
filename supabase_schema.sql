create table public.staff_users (
  id uuid references auth.users on delete cascade not null primary key,
  name text not null,
  email text not null,
  organisation_id uuid not null, -- Assuming organisation_id is a UUID
  role text not null default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.staff_users enable row level security;

-- Policy: Allow users to view staff members within the same organization
-- This assumes you have a way to check the current user's organization, 
-- possibly via a custom claim or by user_metadata if exposed correctly.
-- For simplicity/starting point, we'll allow authenticated users to view rows 
-- where the organisation_id matches the one they claim to be part of (validated by app logic) 
-- OR strictly:
-- create policy "Users can view members of their own organization"
-- on public.staff_users for select
-- using ( 
--   organisation_id::text = (auth.jwt() -> 'user_metadata' ->> 'organisation_id')
-- );

-- Policy: Allow authenticated users (Admins) to insert new staff members
-- You might want to restrict this further to only 'admin' roles if you have a roles system.
create policy "Enable insert for authenticated users" 
on public.staff_users for insert 
with check ( auth.role() = 'authenticated' );

-- Policy: Enable select for authenticated users
-- (You should refine this to valid organizations as shown in the commented policy above)
create policy "Enable select for authenticated users" 
on public.staff_users for select 
using ( auth.role() = 'authenticated' );

-- Policy: Enable delete for authenticated users (Admins)
create policy "Enable delete for authenticated users" 
on public.staff_users for delete 
using ( auth.role() = 'authenticated' );

-- Grant access to the table
grant all on public.staff_users to authenticated;
grant all on public.staff_users to service_role;
